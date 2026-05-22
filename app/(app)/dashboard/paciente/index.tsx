import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppHeader, EmptyState, ErrorNotice, ProfesionalCard, SecondaryButton, Spinner, sharedStyles } from '../../../../src/components/ui';
import { api, type Especialidad, type Profesional } from '../../../../src/lib/api';
import { colors, spacing, borderRadius, fontSize } from '../../../../src/theme';

export default function BuscarProfesionales() {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [obrasSociales, setObrasSociales] = useState<string[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [filters, setFilters] = useState({ especialidad: '', modalidad: '', obraSocial: '', precioMax: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showObraSocial, setShowObraSocial] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [esp, os, profs] = await Promise.all([
        api.especialidades.getAll(),
        api.obrasSociales.getAll(),
        api.profesionales.getAll({ ...filters, page, limit: 10 }),
      ]);
      setEspecialidades(esp);
      setObrasSociales(os);
      setProfesionales(profs.profesionales || []);
      setTotalPages(profs.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar.');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  function selectObraSocial(value: string) {
    setFilters((f) => ({ ...f, obraSocial: f.obraSocial === value ? '' : value }));
    setShowObraSocial(false);
  }

  return (
    <KeyboardAvoidingView style={sharedStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView
      style={sharedStyles.screen}
      contentContainerStyle={sharedStyles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      keyboardShouldPersistTaps="handled"
    >
      <AppHeader />

      <ErrorNotice message={error} />
      {loading && !profesionales.length ? <Spinner /> : null}

      <View style={{ gap: spacing.md }}>
        <TouchableOpacity
          onPress={() => setShowObraSocial(true)}
          style={[sharedStyles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
        >
          <Text style={{ color: filters.obraSocial ? colors.text : colors.textSecondary, flex: 1 }}>
            {filters.obraSocial || 'Obra social'}
          </Text>
          <Text style={{ color: colors.textSecondary }}>▼</Text>
        </TouchableOpacity>

        <View style={sharedStyles.row}>
          <TextInput style={[sharedStyles.input, { flex: 1 }]} placeholder="Precio máx." keyboardType="numeric" value={filters.precioMax} onChangeText={(text) => setFilters((f) => ({ ...f, precioMax: text.replace(/[^0-9]/g, '') }))} />
          <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, modalidad: f.modalidad === 'VIRTUAL' ? 'PRESENCIAL' : 'VIRTUAL' }))} style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.text, textAlign: 'center' }}>{filters.modalidad || 'Modalidad'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, especialidad: '' }))} style={{ padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: !filters.especialidad ? colors.primary : colors.surface }}>
            <Text style={{ color: !filters.especialidad ? colors.white : colors.text }}>Todas</Text>
          </TouchableOpacity>
          {especialidades.map((esp) => (
            <TouchableOpacity key={esp.id} onPress={() => setFilters((f) => ({ ...f, especialidad: esp.id }))} style={{ padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: filters.especialidad === esp.id ? colors.primary : colors.surface }}>
              <Text style={{ color: filters.especialidad === esp.id ? colors.white : colors.text }}>{esp.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {profesionales.map((profesional) => (
          <ProfesionalCard key={profesional.id} profesional={profesional} onPress={() => router.push(`/profesional/${profesional.id}`)} />
        ))}
        {!profesionales.length ? <EmptyState title="Sin profesionales" subtitle="Probá cambiar los filtros." /> : null}
        <View style={sharedStyles.row}>
          <SecondaryButton title="Anterior" onPress={() => setPage((p) => Math.max(1, p - 1))} />
          <Text style={{ color: colors.text, flex: 1, textAlign: 'center' }}>{page} / {totalPages}</Text>
          <SecondaryButton title="Siguiente" onPress={() => setPage((p) => Math.min(totalPages, p + 1))} />
        </View>
      </View>

      <Modal visible={showObraSocial} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '70%', padding: spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={sharedStyles.title}>Obra social</Text>
              <TouchableOpacity onPress={() => setShowObraSocial(false)}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.md }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                onPress={() => selectObraSocial('')}
                style={{ padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: !filters.obraSocial ? colors.muted : 'transparent', marginBottom: spacing.xs }}
              >
                <Text style={{ color: colors.text, fontWeight: !filters.obraSocial ? '700' : '400' }}>Todas</Text>
              </TouchableOpacity>
              {obrasSociales.map((os) => (
                <TouchableOpacity
                  key={os}
                  onPress={() => selectObraSocial(os)}
                  style={{ padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: filters.obraSocial === os ? colors.muted : 'transparent', marginBottom: spacing.xs }}
                >
                  <Text style={{ color: colors.text, fontWeight: filters.obraSocial === os ? '700' : '400' }}>{os}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
