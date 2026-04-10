import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors } from '../theme/colors'

type Props = {
  onSubmit: (correo: string, clave: string) => Promise<void>
}

export function LoginScreen({ onSubmit }: Props) {
  const insets = useSafeAreaInsets()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [mostrarClave, setMostrarClave] = useState(false)
  const [mantenerSesion, setMantenerSesion] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [correoFocused, setCorreoFocused] = useState(false)
  const [claveFocused, setClaveFocused] = useState(false)

  async function handleSubmit() {
    setError(null)
    setCargando(true)
    try {
      await onSubmit(correo.trim(), clave)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  const formularioListo = correo.trim().length > 0 && clave.length > 0
  const botonDeshabilitado = cargando || !formularioListo

  const scrollBody = (
        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 28 },
          ]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loginColumn}>
            <View style={styles.marca}>
              <View style={styles.marcaIconWrap}>
                <MaterialCommunityIcons name="robot-industrial" size={26} color={colors.primary} />
              </View>
              <View style={styles.marcaTextWrap}>
                <Text style={styles.marcaTexto}>ERP Susequid</Text>
                <Text style={styles.marcaSub}>Panel móvil</Text>
              </View>
            </View>

            <View style={styles.formWrap}>
            <Text style={styles.formTitulo}>Iniciar sesión</Text>
            <Text style={styles.formSubtitulo}>Usa tu correo y contraseña institucionales</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Correo institucional</Text>
              <View
                style={[
                  styles.inputShell,
                  correoFocused && styles.inputShellFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="nombre@empresa.com"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                  autoComplete="email"
                  blurOnSubmit={false}
                  value={correo}
                  onChangeText={setCorreo}
                  onFocus={() => setCorreoFocused(true)}
                  onBlur={() => setCorreoFocused(false)}
                />
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.passwordRow}>
                <Text style={styles.labelInline}>Contraseña</Text>
                <Pressable
                  onPress={() =>
                    Alert.alert(
                      'Recuperar clave',
                      'Para restablecer la clave, contacta al administrador del sistema.',
                    )
                  }
                  hitSlop={8}
                >
                  <Text style={styles.enlaceSutil}>¿Olvidaste tu clave?</Text>
                </Pressable>
              </View>
              <View
                style={[
                  styles.inputShell,
                  claveFocused && styles.inputShellFocused,
                ]}
              >
                <TextInput
                  style={[styles.input, styles.inputClave]}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!mostrarClave}
                  textContentType="password"
                  autoComplete="password"
                  blurOnSubmit={false}
                  value={clave}
                  onChangeText={setClave}
                  onFocus={() => setClaveFocused(true)}
                  onBlur={() => setClaveFocused(false)}
                />
                <Pressable
                  style={styles.toggleClave}
                  onPress={() => setMostrarClave((v) => !v)}
                  accessibilityLabel={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <MaterialIcons
                    name={mostrarClave ? 'visibility-off' : 'visibility'}
                    size={22}
                    color={colors.loginOutline}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={styles.checkRow}
              onPress={() => setMantenerSesion((v) => !v)}
            >
              <View style={[styles.checkBox, mantenerSesion && styles.checkBoxOn]}>
                {mantenerSesion ? (
                  <MaterialIcons name="check" size={16} color="#fff" />
                ) : null}
              </View>
              <Text style={styles.checkLabel}>Mantener sesión en este dispositivo</Text>
            </Pressable>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => void handleSubmit()}
              disabled={botonDeshabilitado}
              style={({ pressed }) => [
                styles.submitPress,
                formularioListo && !cargando && styles.submitPressActive,
                pressed && formularioListo && !cargando && styles.submitPressed,
              ]}
            >
              {formularioListo && !cargando ? (
                <LinearGradient
                  colors={['#6366f1', '#4f46e5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitInner}
                >
                  <Text style={styles.submitText}>Entrar</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.submitInner, cargando ? styles.submitInnerOn : styles.submitDisabled]}>
                  {cargando ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.submitText, styles.submitTextDisabled]}>Entrar</Text>
                  )}
                </View>
              )}
            </Pressable>

            <View style={styles.soporte}>
              <View style={styles.soporteIzq}>
                <MaterialIcons name="contact-support" size={18} color={colors.loginOnSurfaceVariant} />
                <Text style={styles.soporteLabel}>Soporte</Text>
              </View>
              <View style={styles.soporteLinks}>
                <Pressable onPress={() => void Linking.openURL('mailto:soporte@empresa.com')}>
                  <Text style={styles.soporteLink}>Contacto</Text>
                </Pressable>
                <Pressable onPress={() => Alert.alert('Seguridad', 'Consulta las políticas de seguridad con tu administrador.')}>
                  <Text style={styles.soporteLink}>Seguridad</Text>
                </Pressable>
              </View>
            </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerCopy}>© {new Date().getFullYear()} Susequid · ERP</Text>
              <View style={styles.footerLinks}>
                <Text style={styles.footerMuted}>Privacidad</Text>
                <Text style={[styles.footerMuted, styles.footerLinkSp]}>Términos</Text>
              </View>
            </View>
          </View>
        </ScrollView>
  )

  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={['#eef2ff', '#f5f3ff', '#f8fafc']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.page, { paddingTop: insets.top }]}
      >
        {Platform.OS === 'ios' ? (
          <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={0}>
            {scrollBody}
          </KeyboardAvoidingView>
        ) : (
          scrollBody
        )}
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  scrollFlex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 8,
  },
  loginColumn: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  formWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#312e81',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 28,
      },
      android: { elevation: 4 },
    }),
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  marcaIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.18)',
  },
  marcaTextWrap: {
    alignItems: 'flex-start',
  },
  marcaTexto: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
  },
  marcaSub: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.loginOnSurfaceVariant,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  formTitulo: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.6,
    marginBottom: 8,
    textAlign: 'center',
    width: '100%',
  },
  formSubtitulo: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 26,
    paddingHorizontal: 8,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 2,
  },
  labelInline: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  enlaceSutil: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.loginTertiaryAccent,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 4,
    minHeight: 54,
  },
  inputShellFocused: {
    backgroundColor: '#fff',
    borderColor: '#a5b4fc',
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.14,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  inputClave: {
    paddingRight: 4,
  },
  toggleClave: {
    padding: 12,
    marginRight: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkBoxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.loginOnSurfaceVariant,
    lineHeight: 20,
  },
  errorBox: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 14,
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
  },
  submitPress: {
    marginTop: 14,
    borderRadius: 999,
    overflow: 'hidden',
  },
  submitPressActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
      },
      android: { elevation: 5 },
    }),
  },
  submitPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  submitInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  submitInnerOn: {
    backgroundColor: colors.primary,
  },
  submitDisabled: {
    backgroundColor: '#e2e8f0',
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  submitTextDisabled: {
    color: '#94a3b8',
  },
  soporte: {
    marginTop: 26,
    paddingTop: 20,
    paddingHorizontal: 4,
    paddingBottom: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.45)',
  },
  soporteIzq: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  soporteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  soporteLinks: {
    flexDirection: 'row',
    gap: 18,
  },
  soporteLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  footerCopy: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0.1,
  },
  footerLinks: {
    flexDirection: 'row',
  },
  footerMuted: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.muted,
  },
  footerLinkSp: {
    marginLeft: 18,
  },
})
