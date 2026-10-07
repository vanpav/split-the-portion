import { createHashRouter, Navigate } from 'react-router'
import { AccountScreen } from '@/screens/Account/AccountScreen'
import { ResetPasswordScreen } from '@/screens/Account/ResetPasswordScreen'
import { CalculatorScreen } from '@/screens/Calculator/CalculatorScreen'
import { NewCompanyScreen } from '@/screens/Calculator/NewCompanyScreen'
import { NewTareScreen } from '@/screens/Calculator/NewTareScreen'
import { CopyTextScreen } from '@/screens/Copy/CopyTextScreen'
import { DishEditorScreen } from '@/screens/DishEditor/DishEditorScreen'
import { FromSimpleDishScreen } from '@/screens/DishEditor/FromSimpleDishScreen'
import { DishMenuScreen } from '@/screens/DishList/DishMenuScreen'
import { HomeScreen } from '@/screens/DishList/HomeScreen'
import { JoinByCodeScreen } from '@/screens/Join/JoinByCodeScreen'
import { JoinScreen } from '@/screens/Join/JoinScreen'
import { SettingsScreen } from '@/screens/Settings/SettingsScreen'
import { COPY_TEXT, FROM_SIMPLE_DISH, NEW_TARE } from './paths'
import { RootLayout } from './RootLayout'

// Screens opened over another one (docs/UX.md §3а) are its child routes: the screen under them stays
// mounted and hidden, so «назад» finds it as it was — the same numbers typed, the same draft.
const fromSimpleDish = { path: FROM_SIMPLE_DISH, element: <FromSimpleDishScreen /> }
const copyText = { path: COPY_TEXT, element: <CopyTextScreen /> }
const newTare = { path: NEW_TARE, element: <NewTareScreen /> }

export const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'dishes', element: <DishMenuScreen /> },
      { path: 'd/new', element: <DishEditorScreen />, children: [fromSimpleDish, newTare] },
      {
        path: 'd/:id',
        element: <CalculatorScreen />,
        children: [
          newTare,
          { path: 'company/new', element: <NewCompanyScreen /> },
          copyText,
        ],
      },
      { path: 'd/:id/edit', element: <DishEditorScreen />, children: [fromSimpleDish, newTare] },
      { path: 'settings', element: <SettingsScreen /> },
      { path: 'settings/:section', element: <SettingsScreen />, children: [copyText] },
      { path: 'account', element: <AccountScreen /> },
      { path: 'account/reset', element: <ResetPasswordScreen /> },
      { path: 'join', element: <JoinByCodeScreen /> },
      { path: 'join/:code', element: <JoinScreen /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
