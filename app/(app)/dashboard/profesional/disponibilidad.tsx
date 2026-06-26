import { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppHeader, ErrorNotice, PrimaryButton, Spinner, getSharedStyles } from '../../../../src/components/ui';
import { api, type Disponibilidad, type BloqueoDisponibilidad, type TipoConsulta } from '../../../../src/lib/api';
import { useAuth } from '../../../../src/lib/auth-context';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { useLang } from '../../../../src/i18n/context';
import { spacing, borderRadius, fontSize } from '../../../../src/theme';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const BLOCKOUT_REASONS = ['Vacaciones', 'Feriado', 'Capacitación', 'Personal', 'Otro'];
const DURACIONES = [15, 20, 30, 45, 60, 90];

export default function ProfesionalDisponibilidad() {
  const { colors } = useTheme();
  const s = getSharedStyles(colors);
  const { t } = useLang();
  const { user } = useAuth();
  const professionalId = user?.profesional?.id;

  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [bloqueos, setBloqueos] = useState<BloqueoDisponibilidad[]>([]);
  const [tipos, setTipos] = useState<TipoConsulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTipoNombre, setNewTipoNombre] = useState('');
  const [newTipoDuracion, setNewTipoDuracion] = useState(30);
  const [newTipoPrecio, setNewTipoPrecio] = useState('');
  const [savingTipo, setSavingTipo] = useState(false);
  const [deletingTipo, setDeletingTipo] = useState<string | null>(null);

  const [newDia, setNewDia] = useState(1);
  const [newHoraInicio, setNewHoraInicio] = useState('09:00');
  const [newHoraFin, setNewHoraFin] = useState('17:00');
  const [newModalidad, setNewModalidad] = useState<'PRESENCIAL' | 'VIRTUAL'>('PRESENCIAL');
  const [newLugar, setNewLugar] = useState('');
  const [savingDisp, setSavingDisp] = useState(false);
  const [deletingDisp, setDeletingDisp] = useState<string | null>(null);

  const [bloqFechaInicio, setBloqFechaInicio] = useState('');
  const [bloqFechaFin, setBloqFechaFin] = useState('');
  const [bloqMotivo, setBloqMotivo] = useState('');
  const [bloqParcial, setBloqParcial] = useState(false);
  const [bloqHoraInicio, setBloqHoraInicio] = useState('');
  const [bloqHoraFin, setBloqHoraFin] = useState('');
  const [savingBloqueo, setSavingBloqueo] = useState(false);

  const load = useCallback(async () => {
    if (!professionalId) return;
    setLoading(true);
    setError(null);
    try {
      const [profData, bloqueosData, tiposData] = await Promise.all([
        api.profesionales.getById(professionalId),
        api.bloqueos.getMisBloqueos(),
        api.profesionales.getTiposConsulta(professionalId),
      ]);
      setDisponibilidades(profData.disponibilidades || []);
      setBloqueos(bloqueosData);
      setTipos(tiposData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common', 'error'));
    } finally {
      setLoading(false);
    }
  }, [professionalId, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddDisp() {
    if (!professionalId) return;
    setSavingDisp(true);
    try {
      await api.profesionales.crearDisponibilidad(professionalId, {
        diaSemana: newDia,
        horaInicio: newHoraInicio,
        horaFin: newHoraFin,
        modalidad: newModalidad,
        lugarAtencion: newLugar.trim() || undefined,
      });
      setNewDia(1);
      setNewHoraInicio('09:00');
      setNewHoraFin('17:00');
      setNewModalidad('PRESENCIAL');
      setNewLugar('');
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo agregar el horario.');
    } finally {
      setSavingDisp(false);
    }
  }

  async function handleDeleteDisp(id: string) {
    if (!professionalId) return;
    setDeletingDisp(id);
    try {
      await api.profesionales.eliminarDisponibilidad(professionalId, id);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar el horario.');
    } finally {
      setDeletingDisp(null);
    }
  }

  async function handleAddTipo() {
    if (!professionalId) return;
    if (!newTipoNombre.trim()) {
      Alert.alert('Error', 'El nombre es requerido.');
      return;
    }
    setSavingTipo(true);
    try {
      await api.profesionales.crearTipoConsulta(professionalId, {
        nombre: newTipoNombre.trim(),
        duracionMin: newTipoDuracion,
        precio: newTipoPrecio.trim() === '' ? null : Number(newTipoPrecio),
      });
      setNewTipoNombre('');
      setNewTipoDuracion(30);
      setNewTipoPrecio('');
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo agregar el tipo de consulta.');
    } finally {
      setSavingTipo(false);
    }
  }

  async function handleDeleteTipo(id: string) {
    if (!professionalId) return;
    setDeletingTipo(id);
    try {
      await api.profesionales.eliminarTipoConsulta(professionalId, id);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar el tipo de consulta.');
    } finally {
      setDeletingTipo(null);
    }
  }

  async function handleAddBloqueo() {
    if (!bloqFechaInicio || !bloqFechaFin) {
      Alert.alert('Error', 'La fecha de inicio y fin son obligatorias.');
      return;
    }
    if (bloqParcial && (!bloqHoraInicio || !bloqHoraFin)) {
      Alert.alert('Error', 'Para bloqueo parcial indicá hora de inicio y fin.');
      return;
    }
    setSavingBloqueo(true);
    try {
      await api.bloqueos.crear({
        fechaInicio: bloqFechaInicio,
        fechaFin: bloqFechaFin,
        horaInicio: bloqParcial ? bloqHoraInicio : undefined,
        horaFin: bloqParcial ? bloqHoraFin : undefined,
        motivo: bloqMotivo || undefined,
      });
      setBloqFechaInicio('');
      setBloqFechaFin('');
      setBloqMotivo('');
      setBloqParcial(false);
      setBloqHoraInicio('');
      setBloqHoraFin('');
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo crear el bloqueo.');
    } finally {
      setSavingBloqueo(false);
    }
  }

  async function handleDeleteBloqueo(id: string) {
    try {
      await api.bloqueos.eliminar(id);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar el bloqueo.');
    }
  }

  function formatFecha(dateKey: string) {
    const d = new Date(dateKey + 'T00:00:00');
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={s.screen}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <AppHeader showBack />

        <Text style={s.title}>{t('professional', 'myAvailability')}</Text>
        <ErrorNotice message={error} />

        {loading ? <Spinner /> : null}

        {/* ── Recurring availability ── */}
        <Text style={[s.title, { fontSize: fontSize.lg }]}>{t('professional', 'availabilityList')}</Text>

        {disponibilidades.length === 0 && !loading ? (
          <View style={[s.row, { justifyContent: 'center', padding: spacing.lg }]}>
            <Text style={s.subtitle}>{t('professional', 'noAvailability')}</Text>
          </View>
        ) : (
          disponibilidades.map(disp => (
            <View
              key={disp.id}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                backgroundColor: colors.surface, borderRadius: borderRadius.lg,
                padding: spacing.md, borderWidth: 1, borderColor: colors.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>
                  {DAYS[disp.diaSemana]}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                  {disp.horaInicio} - {disp.horaFin} · {disp.modalidad === 'VIRTUAL' ? t('professional', 'virtual') : t('professional', 'presencial')}
                  {disp.lugarAtencion ? ` · ${disp.lugarAtencion}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteDisp(disp.id)}
                disabled={deletingDisp === disp.id}
                style={{ padding: spacing.sm }}
              >
                <Text style={{ fontSize: fontSize.lg, color: deletingDisp === disp.id ? colors.textSecondary : colors.error }}>
                  🗑
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Add recurring availability */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: borderRadius.lg,
          padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
        }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>{t('professional', 'addAvailability')}</Text>

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{t('professional', 'day')}</Text>
              <View style={[s.row, { flexWrap: 'wrap' }]}>
                {DAYS_SHORT.map((day, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setNewDia(i)}
                    style={{
                      paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
                      borderRadius: borderRadius.md,
                      backgroundColor: newDia === i ? colors.primary : colors.surface,
                      borderWidth: 1, borderColor: newDia === i ? colors.primary : colors.border,
                      marginRight: 4, marginBottom: 4,
                    }}
                  >
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: newDia === i ? colors.white : colors.text }}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{t('professional', 'from')}</Text>
              <TextInput style={s.input} value={newHoraInicio} onChangeText={setNewHoraInicio} placeholder="09:00" placeholderTextColor={colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{t('professional', 'to')}</Text>
              <TextInput style={s.input} value={newHoraFin} onChangeText={setNewHoraFin} placeholder="17:00" placeholderTextColor={colors.textSecondary} />
            </View>
          </View>

          <View style={[s.row, { gap: spacing.xs }]}>
            {(['PRESENCIAL', 'VIRTUAL'] as const).map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => setNewModalidad(m)}
                style={{
                  flex: 1, paddingVertical: spacing.xs, alignItems: 'center',
                  borderRadius: borderRadius.md,
                  backgroundColor: newModalidad === m ? colors.primary : colors.surface,
                  borderWidth: 1, borderColor: newModalidad === m ? colors.primary : colors.border,
                }}
              >
                <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: newModalidad === m ? colors.white : colors.text }}>
                  {m === 'PRESENCIAL' ? t('professional', 'presencial') : t('professional', 'virtual')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View>
            <Text style={s.label}>{t('professional', 'location')} ({t('professional', 'locationOptional')})</Text>
            <TextInput style={s.input} value={newLugar} onChangeText={setNewLugar} placeholder={t('professional', 'locationOptional')} placeholderTextColor={colors.textSecondary} />
          </View>

          <PrimaryButton title={savingDisp ? t('common', 'loading') : `+ ${t('professional', 'addAvailability')}`} onPress={handleAddDisp} disabled={savingDisp} />
        </View>

        {/* ── Tipos de consulta (duración variable) ── */}
        <Text style={[s.title, { fontSize: fontSize.lg, marginTop: spacing.lg }]}>Tipos de consulta</Text>

        {tipos.length === 0 && !loading ? (
          <View style={[s.row, { justifyContent: 'center', padding: spacing.lg }]}>
            <Text style={s.subtitle}>Sin tipos de consulta. Agregá uno para ofrecer distintas duraciones.</Text>
          </View>
        ) : (
          tipos.map(tipo => (
            <View
              key={tipo.id}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                backgroundColor: colors.surface, borderRadius: borderRadius.lg,
                padding: spacing.md, borderWidth: 1, borderColor: colors.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>{tipo.nombre}</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                  {tipo.duracionMin} min{tipo.precio != null && tipo.precio > 0 ? ` · $${Number(tipo.precio).toLocaleString()}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteTipo(tipo.id)}
                disabled={deletingTipo === tipo.id}
                style={{ padding: spacing.sm }}
              >
                <Text style={{ fontSize: fontSize.lg, color: deletingTipo === tipo.id ? colors.textSecondary : colors.error }}>🗑</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Add tipo de consulta */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: borderRadius.lg,
          padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
        }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>Agregar tipo de consulta</Text>

          <View>
            <Text style={s.label}>Nombre</Text>
            <TextInput style={s.input} value={newTipoNombre} onChangeText={setNewTipoNombre} placeholder="Ej: Primera vez" placeholderTextColor={colors.textSecondary} />
          </View>

          <View>
            <Text style={s.label}>Duración</Text>
            <View style={[s.row, { flexWrap: 'wrap' }]}>
              {DURACIONES.map(min => (
                <TouchableOpacity
                  key={min}
                  onPress={() => setNewTipoDuracion(min)}
                  style={{
                    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
                    borderRadius: borderRadius.md, marginRight: 4, marginBottom: 4,
                    backgroundColor: newTipoDuracion === min ? colors.primary : colors.surface,
                    borderWidth: 1, borderColor: newTipoDuracion === min ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: newTipoDuracion === min ? colors.white : colors.text }}>
                    {min} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <Text style={s.label}>Precio (opcional)</Text>
            <TextInput style={s.input} value={newTipoPrecio} onChangeText={setNewTipoPrecio} keyboardType="numeric" placeholder="—" placeholderTextColor={colors.textSecondary} />
          </View>

          <PrimaryButton title={savingTipo ? t('common', 'loading') : '+ Agregar tipo de consulta'} onPress={handleAddTipo} disabled={savingTipo} />
        </View>

        {/* ── Block-outs ── */}
        <Text style={[s.title, { fontSize: fontSize.lg, marginTop: spacing.lg }]}>{t('professional', 'blockouts')}</Text>

        {bloqueos.length === 0 && !loading ? (
          <View style={[s.row, { justifyContent: 'center', padding: spacing.lg }]}>
            <Text style={s.subtitle}>{t('professional', 'noBlockouts')}</Text>
          </View>
        ) : (
          bloqueos.map(bloq => (
            <View
              key={bloq.id}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                backgroundColor: colors.warning + '15', borderRadius: borderRadius.lg,
                padding: spacing.md, borderWidth: 1, borderColor: colors.warning + '40',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>
                  {formatFecha(bloq.fechaInicio)}{bloq.fechaInicio !== bloq.fechaFin ? ` → ${formatFecha(bloq.fechaFin)}` : ''}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                  {bloq.horaInicio && bloq.horaFin ? `${bloq.horaInicio}–${bloq.horaFin}` : t('professional', 'fullDay')}
                  {bloq.motivo ? ` · ${bloq.motivo}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteBloqueo(bloq.id)} style={{ padding: spacing.sm }}>
                <Text style={{ fontSize: fontSize.lg, color: colors.error }}>🗑</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Add block-out */}
        <View style={{
          backgroundColor: colors.warning + '10', borderRadius: borderRadius.lg,
          padding: spacing.md, borderWidth: 1, borderColor: colors.warning + '30', gap: spacing.sm,
        }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>{t('professional', 'addBlockout')}</Text>

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{t('professional', 'blockoutDate')} inicio</Text>
              <TextInput style={s.input} value={bloqFechaInicio} onChangeText={setBloqFechaInicio} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{t('professional', 'blockoutDate')} fin</Text>
              <TextInput style={s.input} value={bloqFechaFin} onChangeText={setBloqFechaFin} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />
            </View>
          </View>

          <View>
            <Text style={s.label}>{t('professional', 'blockoutReason')}</Text>
            <View style={[s.row, { flexWrap: 'wrap' }]}>
              {['', ...BLOCKOUT_REASONS].map(reason => {
                const active = bloqMotivo === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    onPress={() => setBloqMotivo(reason)}
                    style={{
                      paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
                      borderRadius: borderRadius.md, marginRight: 4, marginBottom: 4,
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderWidth: 1, borderColor: active ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: active ? colors.white : colors.text }}>
                      {reason || 'Sin motivo'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setBloqParcial(!bloqParcial)}
            style={[s.row, { gap: spacing.xs }]}
          >
            <View style={{
              width: 20, height: 20, borderRadius: 4,
              borderWidth: 2, borderColor: colors.primary,
              backgroundColor: bloqParcial ? colors.primary : 'transparent',
              justifyContent: 'center', alignItems: 'center',
            }}>
              {bloqParcial ? <Text style={{ color: colors.white, fontSize: 12 }}>✓</Text> : null}
            </View>
            <Text style={{ fontSize: fontSize.sm, color: colors.text }}>{t('professional', 'partialDay')}</Text>
          </TouchableOpacity>

          {bloqParcial ? (
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>{t('professional', 'startTime')}</Text>
                <TextInput style={s.input} value={bloqHoraInicio} onChangeText={setBloqHoraInicio} placeholder="09:00" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>{t('professional', 'endTime')}</Text>
                <TextInput style={s.input} value={bloqHoraFin} onChangeText={setBloqHoraFin} placeholder="13:00" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>
          ) : null}

          <PrimaryButton title={savingBloqueo ? t('common', 'loading') : `+ ${t('professional', 'addBlockout')}`} onPress={handleAddBloqueo} disabled={savingBloqueo} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
