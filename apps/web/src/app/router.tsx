import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '../pages/HomePage.js';
import { WordBankPage } from '../pages/WordBankPage.js';
import { QuizPage } from '../pages/QuizPage.js';
import { SettingsPage } from '../pages/SettingsPage.js';
import { AppLayout } from './AppLayout.js';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'quiz', element: <QuizPage /> },
      { path: 'word-bank', element: <WordBankPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
