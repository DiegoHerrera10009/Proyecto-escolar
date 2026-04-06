import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native'

export type TareasStackParamList = {
  TareasList: undefined
  TareaDetail: { tareaId: number }
}

export type FlujosStackParamList = {
  FlujosHome: undefined
  FlujoActividad: { tareaId: number; titulo?: string }
}

export type MasStackParamList = {
  MasHome: undefined
  Placeholder: { titulo: string; descripcion: string }
  AdminEjecuciones: undefined
}

export type MainTabParamList = {
  Inicio: undefined
  Tareas: NavigatorScreenParams<TareasStackParamList>
  Flujos: NavigatorScreenParams<FlujosStackParamList>
  Mas: NavigatorScreenParams<MasStackParamList>
}

export type TecnicoTabParamList = {
  Inicio: undefined
  Cuenta: undefined
}

export type TareasStackProps<T extends keyof TareasStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<TareasStackParamList, T>,
  BottomTabScreenProps<MainTabParamList, 'Tareas'>
>

export type FlujosStackProps<T extends keyof FlujosStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<FlujosStackParamList, T>,
  BottomTabScreenProps<MainTabParamList, 'Flujos'>
>

export type MasStackProps<T extends keyof MasStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<MasStackParamList, T>,
  BottomTabScreenProps<MainTabParamList, 'Mas'>
>
