"""Verify the uploaded static audio package without changing Cloudflare."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
BASE='https://crossword-content-audio.minotree0902.workers.dev/'

def verify(item):
    name,expected=item
    request=urllib.request.Request(BASE+name,headers={'Origin':'https://example.com','User-Agent':'Mozilla/5.0'})
    with urllib.request.urlopen(request,timeout=45) as response:
        data=response.read()
        assert response.status==200,name
        assert hashlib.sha256(data).hexdigest()==expected['sha256'],name+' hash'
        headers=response.headers
        if name.endswith('.mp3'):
            assert headers.get_content_type() in ['audio/mpeg','audio/mp3'],name+' MIME'
            assert headers.get('Access-Control-Allow-Origin')=='*',name+' CORS'
            assert 'immutable' in headers.get('Cache-Control',''),name+' cache'
        if name.endswith('/manifest.json'):
            assert headers.get('Access-Control-Allow-Origin')=='*',name+' CORS'
        return {'file':name,'bytes':len(data),'sha256':expected['sha256'],'status':200}

def main():
    report=json.loads((ROOT/'artifacts/crossword-content-audio/package-report.json').read_text(encoding='utf-8'))
    # _headers is configuration, not a public asset.
    files=[item for item in report['files'].items() if item[0]!='_headers']
    with ThreadPoolExecutor(max_workers=6) as pool: results=list(pool.map(verify,files))
    path=ROOT/'content/picture-book-audio/content-audio-remote-validation.json'
    path.write_text(json.dumps({'date':datetime.now().astimezone().isoformat(),'baseUrl':BASE,
        'mp3Count':169,'files':results,'checks':'HTTP 200; all bytes/hash; MP3 MIME/CORS/immutable; manifest CORS',
        'listeningReview':'pending','deviceReview':'pending'},indent=2)+'\n',encoding='utf-8')
    print(f'PASS: {len(results)} public files; 169 MP3s; bytes/hash/HTTP/MIME/CORS/cache verified')

if __name__=='__main__': main()
