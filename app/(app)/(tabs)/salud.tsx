import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState, ErrorNotice, Spinner, getSharedStyles } from '../../../src/components/ui';
import SegmentedControl from '../../../src/components/SegmentedControl';
import { api } from '../../../src/lib/api';
import { spacing, borderRadius, fontSize } from '../../../src/theme';
import { useTheme } from '../../../src/contexts/ThemeContext';

type SaludTab = 'recetas' | 'certificados';

const SEGMENTS: { key: SaludTab; label: string }[] = [
  { key: 'recetas', label: 'Recetas' },
  { key: 'certificados', label: 'Certificados' },
];

interface RecetaItem {
  id: string;
  turnoId: string;
  fechaHora: string;
  receta: { diagnostico: string; medicamentos?: string | null; indicaciones: string };
  profesional: { nombre: string; apellido: string; especialidad: string };
}

interface CertificadoItem {
  id: string;
  turnoId: string;
  fechaHora: string;
  certificado: {
    id: string; tipo: string; emitidaAt: string; diagnostico?: string | null;
    texto?: string | null; diasReposo?: number | null;
  };
  profesional: { nombre: string; apellido: string; especialidad?: { nombre: string } | string };
}

export default function SaludScreen() {
  const { colors } = useTheme();
  const s = getSharedStyles(colors);
  const [tab, setTab] = useState<SaludTab>('recetas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recetas, setRecetas] = useState<RecetaItem[]>([]);
  const [certificados, setCertificados] = useState<CertificadoItem[]>([]);

  const [expandedReceta, setExpandedReceta] = useState<string | null>(null);
  const [expandedCertificado, setExpandedCertificado] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'recetas') {
        const data = await api.pacientes.getMisRecetas();
        setRecetas(data.recetas || []);
      } else if (tab === 'certificados') {
        const data = await api.pacientes.getMisCertificados();
        setCertificados(data.certificados || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  function getEspecialidad(p: CertificadoItem['profesional']): string {
    if (!p.especialidad) return '';
    if (typeof p.especialidad === 'string') return p.especialidad;
    return p.especialidad.nombre;
  }

  function renderRecetas() {
    if (!recetas.length && !loading) {
      return <EmptyState title="Sin recetas" subtitle="Tus recetas digitales aparecerán aquí." />;
    }
    return (
      <View style={{ gap: spacing.sm }}>
        {recetas.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => setExpandedReceta(expandedReceta === item.id ? null : item.id)}
            style={{
              padding: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#10B98118',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: fontSize.md }}>💊</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>
                  Dr. {item.profesional.nombre} {item.profesional.apellido}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                  {item.profesional.especialidad} · {new Date(item.fechaHora).toLocaleDateString('es-AR')}
                </Text>
              </View>
              <Text style={{ fontSize: fontSize.xs, color: colors.muted }}>
                {expandedReceta === item.id ? '▲' : '▼'}
              </Text>
            </View>

            {expandedReceta === item.id ? (
              <View style={{ marginTop: spacing.md, gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
                <View>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary }}>
                    Diagnóstico
                  </Text>
                  <Text style={{ fontSize: fontSize.sm, color: colors.text, marginTop: spacing.xs }}>
                    {item.receta.diagnostico}
                  </Text>
                </View>
                {item.receta.medicamentos ? (
                  <View>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary }}>
                      Medicamentos
                    </Text>
                    <Text style={{ fontSize: fontSize.sm, color: colors.text, marginTop: spacing.xs }}>
                      {item.receta.medicamentos}
                    </Text>
                  </View>
                ) : null}
                <View>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary }}>
                    Indicaciones
                  </Text>
                  <Text style={{ fontSize: fontSize.sm, color: colors.text, marginTop: spacing.xs }}>
                    {item.receta.indicaciones}
                  </Text>
                </View>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function renderCertificados() {
    if (!certificados.length && !loading) {
      return <EmptyState title="Sin certificados" subtitle="Tus certificados médicos aparecerán aquí." />;
    }
    return (
      <View style={{ gap: spacing.sm }}>
        {certificados.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => setExpandedCertificado(expandedCertificado === item.id ? null : item.id)}
            style={{
              padding: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#3B82F618',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: fontSize.md }}>📄</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>
                  {item.certificado.tipo}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                  Dr. {item.profesional.nombre} {item.profesional.apellido}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                  {getEspecialidad(item.profesional)} · {new Date(item.fechaHora).toLocaleDateString('es-AR')}
                </Text>
              </View>
              <Text style={{ fontSize: fontSize.xs, color: colors.muted }}>
                {expandedCertificado === item.id ? '▲' : '▼'}
              </Text>
            </View>

            {expandedCertificado === item.id ? (
              <View style={{ marginTop: spacing.md, gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
                {item.certificado.diagnostico ? (
                  <View>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary }}>
                      Diagnóstico
                    </Text>
                    <Text style={{ fontSize: fontSize.sm, color: colors.text, marginTop: spacing.xs }}>
                      {item.certificado.diagnostico}
                    </Text>
                  </View>
                ) : null}
                {item.certificado.texto ? (
                  <View>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary }}>
                      Detalle
                    </Text>
                    <Text style={{ fontSize: fontSize.sm, color: colors.text, marginTop: spacing.xs }}>
                      {item.certificado.texto}
                    </Text>
                  </View>
                ) : null}
                {item.certificado.diasReposo ? (
                  <View>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary }}>
                      Días de reposo
                    </Text>
                    <Text style={{ fontSize: fontSize.sm, color: colors.text, marginTop: spacing.xs }}>
                      {item.certificado.diasReposo} días
                    </Text>
                  </View>
                ) : null}
                <View>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary }}>
                    Emitido
                  </Text>
                  <Text style={{ fontSize: fontSize.sm, color: colors.text, marginTop: spacing.xs }}>
                    {new Date(item.certificado.emitidaAt).toLocaleDateString('es-AR', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.contentTab, { gap: spacing.md, paddingBottom: spacing.xxl }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <SegmentedControl segments={SEGMENTS} selected={tab} onSelect={(key) => setTab(key as SaludTab)} />
      <ErrorNotice message={error} />

      {tab === 'recetas' ? renderRecetas() : null}
      {tab === 'certificados' ? renderCertificados() : null}
    </ScrollView>
  );
}
