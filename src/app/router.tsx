import { createHashRouter, Navigate } from 'react-router'
import { CalculatorScreen } from '@/screens/Calculator/CalculatorScreen'
import { CookingScreen } from '@/screens/Cooking/CookingScreen'
import { DishScreen } from '@/screens/Dish/DishScreen'
import { DishEditorScreen } from '@/screens/DishEditor/DishEditorScreen'
import { DishListScreen } from '@/screens/DishList/DishListScreen'
import { HistoryScreen } from '@/screens/History/HistoryScreen'
import { SettingsScreen } from '@/screens/Settings/SettingsScreen'
import { RootLayout } from './RootLayout'

export const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <DishListScreen /> },
      { path: 'd/new', element: <DishEditorScreen /> },
      { path: 'd/:id', element: <CalculatorScreen /> },
      { path: 'd/:id/history', element: <DishScreen /> },
      { path: 'd/:id/edit', element: <DishEditorScreen /> },
      { path: 'c/:id', element: <CookingScreen /> },
      { path: 'history', element: <HistoryScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
