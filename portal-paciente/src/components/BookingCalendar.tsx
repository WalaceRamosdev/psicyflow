import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

interface BookingCalendarProps {
  slug: string;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ slug }) => {
  const [therapist, setTherapist] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [occupiedSlots, setOccupiedSlots] = useState<{ time: string }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [consultType, setConsultType] = useState<'online' | 'presencial'>('online');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

  // 1. Fetch Profile on load
  useEffect(() => {
    const loadProfile = async () => {
      try {
        let therapistData = null;

        if (slug === 'demo') {
          // Query the first profile available in database as demo
          const { data } = await supabase.from('profiles').select('*').limit(1);
          if (data && data.length > 0) {
            therapistData = data[0];
          }
        } else {
          // Query by office_domain (slug) or id
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .or(`office_domain.eq.${slug},id.eq.${slug}`)
            .maybeSingle();

          if (data) {
            therapistData = data;
          }
        }

        if (!therapistData) {
          // Fallback template
          therapistData = {
            id: 'guest',
            name: 'Dra. Mariana Costa Silva',
            crp: '06/12345-SP',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
            bio: 'Psicóloga Clínica especialista em Terapia Cognitivo-Comportamental (TCC). Foco no tratamento de ansiedade, depressão, estresse laboral e transições de carreira. Atendimento acolhedor e humanizado.',
            specialties: ['Ansiedade', 'Depressão', 'TCC', 'Estresse'],
            session_value: 180.00,
            booking_rules: {
              startHour: "08:00",
              endHour: "18:00",
              bufferMinutes: 15,
              lunchStart: "12:00",
              lunchEnd: "13:00",
              workDays: [1, 2, 3, 4, 5]
            }
          };
        }

        setTherapist(therapistData);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [slug]);

  // Derived settings
  const psychologistId = therapist?.id || 'guest';
  const sessionValue = therapist?.session_value || 150.00;
  const bookingRules = therapist?.booking_rules || {
    startHour: "08:00",
    endHour: "18:00",
    bufferMinutes: 15,
    lunchStart: "12:00",
    lunchEnd: "13:00",
    workDays: [1, 2, 3, 4, 5]
  };

  // 2. Generate list of dates for the next 14 days
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + i);
      
      const dayOfWeek = futureDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const isWorkingDay = (bookingRules.workDays || [1,2,3,4,5]).includes(dayOfWeek);
      
      if (isWorkingDay) {
        const yyyy = futureDate.getFullYear();
        const mm = String(futureDate.getMonth() + 1).padStart(2, '0');
        const dd = String(futureDate.getDate()).padStart(2, '0');
        
        dates.push({
          formatted: `${dd}/${mm}`,
          raw: `${yyyy}-${mm}-${dd}`,
          dayName: futureDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
        });
      }
    }
    return dates;
  }, [bookingRules]);

  // 3. Load occupied slots when date is selected
  useEffect(() => {
    if (!selectedDate || psychologistId === 'guest') return;

    const fetchOccupiedSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const { data, error } = await supabase
          .from('occupied_slots')
          .select('time')
          .eq('psychologist_id', psychologistId)
          .eq('date', selectedDate);

        if (error) throw error;
        setOccupiedSlots(data || []);
      } catch (err) {
        console.error("Failed to load occupied slots:", err);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchOccupiedSlots();
    setSelectedTime('');
  }, [selectedDate, psychologistId]);

  // 4. Generate hourly slots based on booking rules
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    if (!selectedDate) return slots;

    const [startH, startM] = (bookingRules.startHour || '08:00').split(':').map(Number);
    const [endH, endM] = (bookingRules.endHour || '18:00').split(':').map(Number);
    const [lunchStartH, lunchStartM] = (bookingRules.lunchStart || '12:00').split(':').map(Number);
    const [lunchEndH, lunchEndM] = (bookingRules.lunchEnd || '13:00').split(':').map(Number);
    
    let current = new Date();
    current.setHours(startH, startM, 0, 0);
    
    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === todayStr;
    const now = new Date();

    while (current < end) {
      const hh = String(current.getHours()).padStart(2, '0');
      const mm = String(current.getMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      const currentVal = current.getHours() * 60 + current.getMinutes();
      const lunchStartVal = lunchStartH * 60 + lunchStartM;
      const lunchEndVal = lunchEndH * 60 + lunchEndM;
      const isLunch = currentVal >= lunchStartVal && currentVal < lunchEndVal;

      let isPast = false;
      if (isToday) {
        const slotTime = new Date();
        slotTime.setHours(current.getHours(), current.getMinutes(), 0, 0);
        isPast = slotTime <= now;
      }

      if (!isLunch && !isPast) {
        slots.push(timeStr);
      }

      current.setMinutes(current.getMinutes() + 60);
    }

    return slots;
  }, [selectedDate, bookingRules]);

  // 5. Submit appointment booking flow
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !name || !email || !phone || !cpf) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!acceptedTerms) {
      setErrorMsg('Você precisa ler e aceitar os Termos de Uso e a Política de Privacidade (LGPD) para prosseguir.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Step A: Insert patient row
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .insert({
          psychologist_id: psychologistId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          cpf: cpf.trim(),
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
          subscription_status: 'inactive'
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Generate Jitsi Link
      const sanitizedPsychId = psychologistId.replace(/[^a-zA-Z0-9]/g, '');
      const uniqueApptId = Math.random().toString(36).substring(2, 10);
      const generatedRoomUrl = `https://meet.jit.si/PsychFlow_${sanitizedPsychId}_${uniqueApptId}`;

      // Step B: Insert appointment row
      const { data: apptData, error: apptError } = await supabase
        .from('appointments')
        .insert({
          psychologist_id: psychologistId,
          patient_id: patientData.id,
          patient_name: name.trim(),
          patient_avatar: patientData.avatar,
          date: selectedDate,
          time: `${selectedTime}:00`,
          duration: 50,
          status: 'requested',
          type: consultType,
          room_url: generatedRoomUrl
        })
        .select()
        .single();

      if (apptError) throw apptError;

      setSuccessData({
        patientName: name.trim(),
        date: selectedDate.split('-').reverse().join('/'),
        time: selectedTime,
        type: consultType,
        roomUrl: generatedRoomUrl,
        sessionValue: sessionValue
      });
    } catch (err: any) {
      console.error("Booking Error:", err);
      setErrorMsg(err.message || 'Houve um erro ao processar o seu agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Shimmer Skeletons while loading profile details
  if (isLoadingProfile) {
    return (
      <div className="grid-layout">
        <section className="profile-column">
          <div className="profile-card glass-card shimmer-bg">
            <div className="shimmer-avatar"></div>
            <div className="shimmer-line title"></div>
            <div className="shimmer-line subtitle"></div>
            <div className="shimmer-line text"></div>
          </div>
        </section>
        <section className="booking-column glass-card flex-center">
          <div className="loading-spinner-circle"></div>
          <p className="loading-text-widget">Carregando portal de agendamento seguro...</p>
        </section>
      </div>
    );
  }

  // Render Success Screen
  if (successData) {
    return (
      <div className="success-card glass-card fade-in">
        <div className="success-header">
          <span className="success-icon">✨</span>
          <h3>Pré-Agendamento Concluído!</h3>
          <p>Sua sessão foi enviada para confirmação com o profissional.</p>
        </div>

        <div className="summary-box">
          <div className="summary-item">
            <span>Paciente</span>
            <strong>{successData.patientName}</strong>
          </div>
          <div className="summary-item">
            <span>Data e Hora</span>
            <strong>{successData.date} às {successData.time}</strong>
          </div>
          <div className="summary-item">
            <span>Modalidade</span>
            <strong>{successData.type === 'online' ? '🌐 Teleconsulta Online' : '🏢 Presencial (Consultório)'}</strong>
          </div>
          <div className="summary-item">
            <span>Valor da Sessão</span>
            <strong>R$ {successData.sessionValue}</strong>
          </div>
        </div>

        {successData.type === 'online' && (
          <div className="telehealth-box">
            <h4>🛡️ Sala de Vídeo Segura</h4>
            <p>Seu link exclusivo para a teleconsulta do Jitsi Meet já foi gerado:</p>
            <a href={successData.roomUrl} target="_blank" rel="noopener noreferrer" className="jitsi-link-btn">
              Acessar Sala da Consulta
            </a>
          </div>
        )}

        <div className="payment-box">
          <h4>💳 Confirmar Pagamento</h4>
          {therapist?.pix_key ? (
            <>
              <p>Realize o pagamento prioritariamente por PIX para garantir a reserva definitiva da sua vaga:</p>
              <div className="pix-wrapper">
                <div className="pix-qr" style={{ fontSize: '11px', padding: '8px', wordBreak: 'break-all' }}>
                  {therapist.pix_key}
                </div>
                <button className="pix-btn" onClick={() => {
                  navigator.clipboard.writeText(therapist.pix_key).then(() => {
                    alert('✅ Chave PIX copiada com sucesso!');
                  }).catch(() => {
                    // Fallback para navegadores sem Clipboard API
                    const ta = document.createElement('textarea');
                    ta.value = therapist.pix_key;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    alert('✅ Chave PIX copiada com sucesso!');
                  });
                }}>
                  📋 Copiar Chave PIX
                </button>
              </div>
              <p style={{ fontSize: '11px', color: '#64748B', marginTop: '12px', textAlign: 'center' }}>
                Valor: <strong style={{ color: '#0D9488' }}>R$ {successData.sessionValue}</strong> • Envie o comprovante ao profissional.
              </p>
              
              <div style={{ marginTop: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                <p style={{ fontSize: '12px', color: '#475569', textAlign: 'center' }}>
                  <strong>Outras formas de pagamento:</strong><br />
                  Se preferir, o pagamento também poderá ser realizado via Cartão de Crédito, Débito ou Dinheiro (a combinar na sessão).
                </p>
              </div>
            </>
          ) : (
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>
              O profissional ainda não cadastrou uma chave PIX. O pagamento poderá ser feito diretamente no consultório ou por outro meio combinado.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Render Booking Widget
  return (
    <div className="grid-layout fade-in">
      {/* Column 1: Therapist Info Card */}
      <section className="profile-column">
        <div className="profile-card glass-card">
          <div className="profile-header">
            <img src={therapist.avatar} alt="Avatar do Psicólogo" className="therapist-avatar" />
            <div className="profile-info">
              <h1 className="therapist-name">{therapist.name}</h1>
              <span className="therapist-crp">CRP {therapist.crp || 'Não Informado'}</span>
            </div>
          </div>
          
          <div className="separator"></div>
          
          <p className="therapist-bio">{therapist.bio || 'Sem descrição cadastrada.'}</p>
          
          <div className="specialties-section">
            <h4>Especialidades</h4>
            <div className="specialties-grid">
              {(therapist.specialties || ['Psicoterapia Geral']).map((spec: string) => (
                <span key={spec} className="specialty-chip">{spec}</span>
              ))}
            </div>
          </div>

          <div className="separator"></div>

          <div className="price-section">
            <div className="price-box">
              <span className="price-label">Valor da Sessão</span>
              <h2 className="session-price">R$ {sessionValue}</h2>
            </div>
          </div>
        </div>
      </section>

      {/* Column 2: Interactive Scheduling Calendar & Fields */}
      <section className="booking-column glass-card">
        <div className="booking-widget">
          {/* Step 1: Select Date */}
          <div className="step-container">
            <h3 className="step-title">1. Selecione o Dia</h3>
            <div className="dates-grid">
              {availableDates.map((date) => (
                <button
                  key={date.raw}
                  type="button"
                  className={`date-chip ${selectedDate === date.raw ? 'active' : ''}`}
                  onClick={() => setSelectedDate(date.raw)}
                >
                  <span className="date-day-name">{date.dayName}</span>
                  <span className="date-formatted">{date.formatted}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Time */}
          {selectedDate && (
            <div className="step-container fade-in">
              <h3 className="step-title">2. Escolha o Horário</h3>
              {isLoadingSlots ? (
                <div className="loading-spinner">Carregando horários...</div>
              ) : timeSlots.length === 0 ? (
                <p className="no-slots">Nenhum horário disponível para este dia.</p>
              ) : (
                <div className="slots-grid">
                  {timeSlots.map((time) => {
                    const isOccupied = occupiedSlots.some((slot) => slot.time.substring(0, 5) === time);
                    return (
                      <button
                        key={time}
                        type="button"
                        disabled={isOccupied}
                        className={`time-chip ${selectedTime === time ? 'active' : ''} ${isOccupied ? 'occupied' : ''}`}
                        onClick={() => !isOccupied && setSelectedTime(time)}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Fill Form & Confirm */}
          {selectedDate && selectedTime && (
            <form onSubmit={handleBooking} className="booking-form glass-card fade-in">
              <h3 className="form-header-title">3. Detalhes de Contato</h3>
              
              {errorMsg && <div className="error-alert">{errorMsg}</div>}

              <div className="input-group">
                <label htmlFor="patient-name">Nome Completo *</label>
                <input
                  id="patient-name"
                  type="text"
                  required
                  placeholder="Digite seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="input-grid">
                <div className="input-group">
                  <label htmlFor="patient-email">E-mail *</label>
                  <input
                    id="patient-email"
                    type="email"
                    required
                    placeholder="nome@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="patient-phone">Celular (WhatsApp) *</label>
                  <input
                    id="patient-phone"
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-grid">
                <div className="input-group">
                  <label htmlFor="patient-cpf">CPF (Faturamento) *</label>
                  <input
                    id="patient-cpf"
                    type="text"
                    required
                    placeholder="123.456.789-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="consult-type">Modalidade *</label>
                  <select
                    id="consult-type"
                    value={consultType}
                    onChange={(e: any) => setConsultType(e.target.value)}
                  >
                    <option value="online">🌐 Online (Vídeo)</option>
                    <option value="presencial">🏢 Presencial (Consultório)</option>
                  </select>
                </div>
              </div>

              <div className="lgpd-consent-wrapper">
                <label className="lgpd-consent-label">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    required
                    className="lgpd-checkbox"
                  />
                  <span className="lgpd-text">
                    Estou de acordo com os <strong>Termos de Uso</strong> e a <strong>Política de Privacidade</strong> do PsychFlow e dou consentimento livre e inequívoco para o tratamento seguro dos meus dados pessoais informados para fins de agendamento de consultas clínicas, em conformidade com a LGPD.
                  </span>
                </label>
              </div>

              <button type="submit" disabled={isSubmitting} className="submit-booking-btn">
                {isSubmitting ? 'Agendando...' : 'Confirmar e Reservar Vaga'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
