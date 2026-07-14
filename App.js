import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL } from './mobile/config';

// Máquinas de tabaco registradas
const MACHINES = [
  {
    id: 1,
    name: 'Máquina Tabaco — Local 1',
    address: 'Calle Mayor 12, España',
    lat: 40.4168,
    lon: -3.7038,
  },
  {
    id: 2,
    name: 'Máquina Tabaco — Local 2',
    address: 'Avenida Principal 45, España',
    lat: 40.4200,
    lon: -3.6900,
  },
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function requestLocationAndGetMachines() {
  let userLat = null;
  let userLon = null;
  let locationLabel = 'Ubicación no disponible';

  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'SmokeAndGo necesita tu ubicación',
          message: 'Para mostrarte las máquinas más cercanas necesitamos acceso a tu localización.',
          buttonPositive: 'Permitir',
          buttonNegative: 'Ahora no',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        locationLabel = 'Permiso de ubicación denegado';
      }
    }

    if (locationLabel !== 'Permiso de ubicación denegado') {
      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            userLat = pos.coords.latitude;
            userLon = pos.coords.longitude;
            locationLabel = `${userLat.toFixed(5)}, ${userLon.toFixed(5)}`;
            resolve();
          },
          () => {
            locationLabel = 'No se pudo obtener ubicación';
            resolve();
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
        );
      });
    }
  } catch (_) {
    locationLabel = 'Error al obtener ubicación';
  }

  const machinesWithDist = MACHINES.map((m) => ({
    ...m,
    distance:
      userLat !== null ? haversineKm(userLat, userLon, m.lat, m.lon) : null,
  })).sort((a, b) => {
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  return { userLat, userLon, locationLabel, machines: machinesWithDist };
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [mapData, setMapData] = useState(null);

  async function goToMap() {
    setLoading(true);
    try {
      const data = await requestLocationAndGetMachines();
      setMapData(data);
      setScreen('map');
    } catch (_) {
      setScreen('map');
    } finally {
      setLoading(false);
    }
  }

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
      setEmail('');
      setPassword('');
      await goToMap();
    } catch (err) {
      Alert.alert('Login fallido', String(err?.message || err));
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
      // Guarda en /save para el popup de Windows
      await fetch(`${API_URL}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user_register',
          name,
          email,
          birthdate,
          ts: Date.now(),
        }),
      }).catch(() => {});

      // Registro en la base de datos
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409) {
          Alert.alert('Email en uso', 'Ese correo ya está registrado. Prueba a iniciar sesión.');
          setLoading(false);
          return;
        }
        throw new Error(data?.error || 'Error al registrar');
      }

      setName('');
      setEmail('');
      setPassword('');
      setBirthdate('');
      Alert.alert('¡Bienvenido!', 'Registro completado. Buscando máquinas cercanas…');
      await goToMap();
    } catch (err) {
      Alert.alert('Registro fallido', String(err?.message || err));
      setLoading(false);
    }
  }

  function openMaps(machine) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${machine.lat},${machine.lon}&travelmode=walking`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'No se pudo abrir Google Maps')
    );
  }

  function renderHome() {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('./mobile/assets/images/syg.jpg')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>SmokeAndGo</Text>
        <Text style={styles.subtitle}>Encuentra tu máquina de tabaco más cercana</Text>
        <TouchableOpacity style={styles.button} onPress={() => setScreen('login')}>
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => setScreen('register')}>
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
          <Text style={styles.link}>← Volver</Text>
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
          placeholder="Mínimo 8 caracteres"
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
          <Text style={styles.link}>← Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderMap() {
    const { locationLabel, machines } = mapData || { locationLabel: 'Obteniendo ubicación…', machines: MACHINES.map((m) => ({ ...m, distance: null })) };
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('./mobile/assets/images/syg.jpg')} style={styles.logoSmall} resizeMode="contain" />
        <Text style={styles.titleSmall}>Máquinas cercanas</Text>
        <View style={styles.locationBar}>
          <Text style={styles.locationText}>📍 {locationLabel}</Text>
        </View>

        {machines.map((m, idx) => (
          <View key={m.id} style={[styles.machineCard, idx === 0 && styles.machineCardNearest]}>
            {idx === 0 && (
              <View style={styles.nearestBadge}>
                <Text style={styles.nearestBadgeText}>⭐ Más cercana</Text>
              </View>
            )}
            <Text style={styles.machineName}>{m.name}</Text>
            <Text style={styles.machineAddress}>{m.address}</Text>
            {m.distance !== null ? (
              <Text style={styles.machineDistance}>
                {m.distance < 1
                  ? `${Math.round(m.distance * 1000)} m`
                  : `${m.distance.toFixed(1)} km`}
              </Text>
            ) : (
              <Text style={styles.machineDistance}>Distancia no disponible</Text>
            )}
            <TouchableOpacity style={styles.mapsButton} onPress={() => openMaps(m)}>
              <Text style={styles.mapsButtonText}>🗺️ Cómo llegar</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.button, { marginTop: 20 }]}
          onPress={() => {
            setMapData(null);
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
      {screen === 'map' && renderMap()}
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
    width: 90,
    height: 90,
    marginBottom: 10,
    borderRadius: 45,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#E64222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 22,
  },
  titleSmall: {
    fontSize: 26,
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
    paddingVertical: 13,
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: '#D62828',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    color: '#D62828',
    marginTop: 8,
    fontSize: 15,
  },
  locationBar: {
    width: '100%',
    backgroundColor: '#FFF0DC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#FFB380',
  },
  locationText: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
  },
  machineCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFB380',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  machineCardNearest: {
    borderColor: '#FF6A00',
    borderWidth: 2,
  },
  nearestBadge: {
    backgroundColor: '#FF6A00',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  nearestBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  machineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  machineAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  machineDistance: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E64222',
    marginBottom: 12,
  },
  mapsButton: {
    backgroundColor: '#4285F4',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  mapsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

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
