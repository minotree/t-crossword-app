import { Link } from 'react-router-dom';
import { HomeScreen, HomeIcon } from '@t-crossword/ui';
import '@t-crossword/ui/tokens.css';
import '@t-crossword/ui/home/home.css';
import '../styles/home.css';

export function HomePage() {
  return <HomeScreen
    quizAction={<Link to="/quiz" className="mnu-home__action mnu-web-home-action"><HomeIcon name="quiz" /><span>퀴즈 시작</span></Link>}
    wordBankAction={<Link to="/word-bank" className="mnu-home__action mnu-web-home-action mnu-web-home-action--outline"><HomeIcon name="book" /><span>단어장 보기</span></Link>}
  />;
}
