import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text } from 'react-native'

import type { FlujosStackParamList, MasStackParamList, TecnicoTabParamList } from './types'
import { FlujosHomeScreen } from '../screens/flujos/FlujosHomeScreen'
import { FlujoActividadScreen } from '../screens/flujos/FlujoActividadScreen'
import { MasScreen } from '../screens/MasScreen'
import { PlaceholderScreen } from '../screens/PlaceholderScreen'
import { AdminEjecucionesScreen } from '../screens/AdminEjecucionesScreen'
import { colors } from '../theme/colors'

const Tab = createBottomTabNavigator<TecnicoTabParamList>()
const InicioStack = createNativeStackNavigator<FlujosStackParamList>()
const CuentaStack = createNativeStackNavigator<MasStackParamList>()

const stackScreenOpts = {
  headerStyle: { backgroundColor: colors.bgElevated },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600' as const },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
}

function InicioTecnicoStack() {
  return (
    <InicioStack.Navigator screenOptions={stackScreenOpts}>
      <InicioStack.Screen name="FlujosHome" component={FlujosHomeScreen} options={{ title: 'Inicio' }} />
      <InicioStack.Screen name="FlujoActividad" component={FlujoActividadScreen} options={{ title: 'Actividad' }} />
    </InicioStack.Navigator>
  )
}

function CuentaTecnicoStack() {
  return (
    <CuentaStack.Navigator screenOptions={stackScreenOpts}>
      <CuentaStack.Screen name="MasHome" component={MasScreen} options={{ title: 'Cuenta' }} />
      <CuentaStack.Screen
        name="Placeholder"
        component={PlaceholderScreen}
        options={({ route }) => ({ title: route.params.titulo })}
      />
      <CuentaStack.Screen name="AdminEjecuciones" component={AdminEjecucionesScreen} options={{ title: 'Ejecuciones' }} />
    </CuentaStack.Navigator>
  )
}

/** Técnico / supervisor: mismo flujo que el dashboard web (menú + actividades), sin pestañas extra de administración. */
export function TecnicoNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={InicioTecnicoStack}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⌂</Text>,
        }}
      />
      <Tab.Screen
        name="Cuenta"
        component={CuentaTecnicoStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>◉</Text>,
        }}
      />
    </Tab.Navigator>
  )
}
