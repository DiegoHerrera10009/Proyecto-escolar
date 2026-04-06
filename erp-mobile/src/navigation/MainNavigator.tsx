import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text } from 'react-native'

import type { FlujosStackParamList, MainTabParamList, MasStackParamList, TareasStackParamList } from './types'
import { TecnicoNavigator } from './TecnicoNavigator'
import { esVistaSoloPanelCampo } from '../auth/roles'
import { useSession } from '../context/SessionContext'
import { DashboardScreen } from '../screens/DashboardScreen'
import { TareasListScreen } from '../screens/TareasListScreen'
import { TareaDetailScreen } from '../screens/TareaDetailScreen'
import { FlujosHomeScreen } from '../screens/flujos/FlujosHomeScreen'
import { FlujoActividadScreen } from '../screens/flujos/FlujoActividadScreen'
import { MasScreen } from '../screens/MasScreen'
import { PlaceholderScreen } from '../screens/PlaceholderScreen'
import { AdminEjecucionesScreen } from '../screens/AdminEjecucionesScreen'
import { colors } from '../theme/colors'

const Tab = createBottomTabNavigator<MainTabParamList>()
const TareasStack = createNativeStackNavigator<TareasStackParamList>()
const FlujosStack = createNativeStackNavigator<FlujosStackParamList>()
const MasStack = createNativeStackNavigator<MasStackParamList>()

const stackScreenOpts = {
  headerStyle: { backgroundColor: colors.bgElevated },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600' as const },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
}

function TareasNavigator() {
  return (
    <TareasStack.Navigator screenOptions={stackScreenOpts}>
      <TareasStack.Screen name="TareasList" component={TareasListScreen} options={{ title: 'Tareas' }} />
      <TareasStack.Screen name="TareaDetail" component={TareaDetailScreen} options={{ title: 'Detalle' }} />
    </TareasStack.Navigator>
  )
}

function FlujosNavigator() {
  return (
    <FlujosStack.Navigator screenOptions={stackScreenOpts}>
      <FlujosStack.Screen name="FlujosHome" component={FlujosHomeScreen} options={{ title: 'Flujos' }} />
      <FlujosStack.Screen name="FlujoActividad" component={FlujoActividadScreen} options={{ title: 'Actividad' }} />
    </FlujosStack.Navigator>
  )
}

function MasNavigator() {
  return (
    <MasStack.Navigator screenOptions={stackScreenOpts}>
      <MasStack.Screen name="MasHome" component={MasScreen} options={{ title: 'Más' }} />
      <MasStack.Screen name="Placeholder" component={PlaceholderScreen} options={({ route }) => ({ title: route.params.titulo })} />
      <MasStack.Screen name="AdminEjecuciones" component={AdminEjecucionesScreen} options={{ title: 'Ejecuciones' }} />
    </MasStack.Navigator>
  )
}

/** Admin u otros roles: acceso al resumen admin, listado de tareas API, flujos y más opciones. */
function AdminYOtrosNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgElevated },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⌂</Text>,
        }}
      />
      <Tab.Screen
        name="Tareas"
        component={TareasNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>☰</Text>,
        }}
      />
      <Tab.Screen
        name="Flujos"
        component={FlujosNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>↻</Text>,
        }}
      />
      <Tab.Screen
        name="Mas"
        component={MasNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>•••</Text>,
        }}
      />
    </Tab.Navigator>
  )
}

export function MainNavigator() {
  const { roles } = useSession()
  if (esVistaSoloPanelCampo(roles)) {
    return <TecnicoNavigator />
  }
  return <AdminYOtrosNavigator />
}
