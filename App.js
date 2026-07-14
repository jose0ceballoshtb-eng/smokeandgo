import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL } from './mobile/config';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [token, setToken] = useState(null);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Faltan datos', 'Introduce email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.token) {
        throw new Error(data?.error || 'No se pudo iniciar sesión');
      }
      setToken(data.token);
      setScreen('dashboard');
    } catch (err) {
      Alert.alert('Login fallido', String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!name || !email || !password || !birthdate) {
      Alert.alert('Faltan datos', 'Completa nombre, correo, contraseña y fecha de nacimiento.');
      return;
    }
    setLoading(true);
    try {
      const saveRes = await fetch(`${API_URL}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user_register',
          name,
          email,
          birthdate,
          ts: Date.now(),
        }),
      });
      if (!saveRes.ok) {
        throw new Error('No se pudo enviar el registro al servidor público.');
      }

      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert(
          'Registro recibido',
          `Se guardó en servidor público y se notificó al popup. Cuenta de login no creada: ${data?.error || 'error de auth'}`
        );
      } else {
        Alert.alert('Registro completado', 'Usuario creado correctamente.');
      }
      setScreen('home');
      setName('');
      setEmail('');
      setPassword('');
      setBirthdate('');
    } catch (err) {
      Alert.alert('Registro fallido', String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  function renderHome() {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('./mobile/assets/images/syg.jpg')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>SmokeAndGo</Text>
        <Text style={styles.subtitle}>Elige Login o Registrar</Text>
        <TouchableOpacity style={styles.button} onPress={() => setScreen('login')}>
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => setScreen('register')}>
          <Text style={styles.buttonText}>Crear cuenta</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderLogin() {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('./mobile/assets/images/syg.jpg')} style={styles.logoSmall} resizeMode="contain" />
        <Text style={styles.titleSmall}>Login</Text>
        <Text style={styles.fieldLabel}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@correo.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.fieldLabel}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Introduce tu contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setScreen('home')}>
          <Text style={styles.link}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderRegister() {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('./mobile/assets/images/syg.jpg')} style={styles.logoSmall} resizeMode="contain" />
        <Text style={styles.titleSmall}>Registro</Text>
        <Text style={styles.fieldLabel}>Nombre completo</Text>
        <TextInput style={styles.input} placeholder="Tu nombre" value={name} onChangeText={setName} />
        <Text style={styles.fieldLabel}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@correo.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.fieldLabel}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Crea una contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Text style={styles.fieldLabel}>Fecha de nacimiento</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/AAAA"
          value={birthdate}
          onChangeText={setBirthdate}
        />
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Registrar</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setScreen('home')}>
          <Text style={styles.link}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderDashboard() {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('./mobile/assets/images/syg.jpg')} style={styles.logoSmall} resizeMode="contain" />
        <Text style={styles.title}>SmokeAndGo</Text>
        <Text style={styles.subtitle}>Sesión iniciada correctamente</Text>
        <Text style={styles.tokenLabel}>Token: {token ? `${token.slice(0, 18)}...` : 'N/A'}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setToken(null);
            setScreen('home');
          }}
        >
          <Text style={styles.buttonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {screen === 'home' && renderHome()}
      {screen === 'login' && renderLogin()}
      {screen === 'register' && renderRegister()}
      {screen === 'dashboard' && renderDashboard()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF4E8',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 40,
    minHeight: '100%',
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 12,
    borderRadius: 80,
  },
  logoSmall: {
    width: 110,
    height: 110,
    marginBottom: 10,
    borderRadius: 55,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#E64222',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 18,
  },
  titleSmall: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E64222',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FFB380',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  fieldLabel: {
    width: '100%',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    backgroundColor: '#FF6A00',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    color: '#D62828',
    marginTop: 6,
  },
  tokenLabel: {
    fontSize: 13,
    color: '#444',
    marginBottom: 18,
    textAlign: 'center',
  },
});
