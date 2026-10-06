import { createHashRouter, Navigate } from 'react-router'
import { AccountScreen } from '@/screens/Account/AccountScreen'
import { ResetPasswordScreen } from '@/screens/Account/ResetPasswordScreen'
import { CalculatorScreen } from '@/screens/Calculator/CalculatorScreen'
import { DishEditorScreen } from '@/screens/DishEditor/DishEditorScreen'
import { DishMenuScreen } from '@/screens/DishList/DishMenuScreen'
import { HomeScreen } from '@/screens/DishList/HomeScreen'
import { JoinScreen } from '@/screens/Join/JoinScreen'
import { SettingsScreen } from '@/screens/Settings/SettingsScreen'
import { RootLayout } from './RootLayout'

export const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'dishes', element: <DishMenuScreen /> },
      { path: 'd/new', element: <DishEditorScreen /> },
      { path: 'd/:id', element: <CalculatorScreen /> },
      { path: 'd/:id/edit', element: <DishEditorScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
      { path: 'settings/:section', element: <SettingsScreen /> },
      { path: 'account', element: <AccountScreen /> },
      { path: 'account/reset', element: <ResetPasswordScreen /> },
      { path: 'join/:code', element: <JoinScreen /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
