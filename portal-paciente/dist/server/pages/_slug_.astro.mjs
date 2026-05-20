import { Q as createComponent, B as addAttribute, a1 as renderHead, a4 as renderSlot, a6 as renderTemplate, O as createAstro, $ as renderComponent, Z as maybeRenderHead } from '../chunks/astro/server_BdknY_pA.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                                  */
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
export { renderers } from '../renderers.mjs';

const $$Astro$1 = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title, description = "Agendamento de Consultas de Psicoterapia Seguras e Online" } = Astro2.props;
  return renderTemplate`<html lang="pt-BR"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>${title} | PsychFlow</title><meta name="description"${addAttribute(description, "content")}><!-- Typography: Google Fonts Outfit & Inter --><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">${renderHead()}</head> <body> <div class="bg-gradient"></div> <div class="glow-orb-1"></div> <div class="glow-orb-2"></div> <main class="main-container"> ${renderSlot($$result, $$slots["default"])} </main> <footer class="footer"> <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} PsychFlow. Todos os direitos reservados. 🛡️ HIPAA & LGPD Compliant.</p> </footer> </body></html>`;
}, "C:/Users/HP/Documents/projetos alpha code/app para psic\xF3logos - react native/portal-paciente/src/layouts/Layout.astro", void 0);

const supabaseUrl = "https://rgcgxiuhvzvjhxnolnic.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnY2d4aXVodnp2amh4bm9sbmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjQ5ODksImV4cCI6MjA5NDgwMDk4OX0.afYc85o_YKVbLSrFXvCpcZdynks1_s_ig5pHSPtYgzw";
const supabase = typeof window !== "undefined" ? createClient(supabaseUrl, supabaseAnonKey) : new Proxy({}, {
  get: (target, prop) => {
    return () => {
      return {
        from: () => ({
          select: () => ({ limit: () => ({}) }),
          insert: () => ({ select: () => ({ single: () => ({}) }) }),
          eq: () => ({ eq: () => ({}) })
        })
      };
    };
  }
});

const BookingCalendar = ({ slug }) => {
  const [therapist, setTherapist] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [consultType, setConsultType] = useState("online");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  useEffect(() => {
    const loadProfile = async () => {
      try {
        let therapistData = null;
        if (slug === "demo") {
          const { data } = await supabase.from("profiles").select("*").limit(1);
          if (data && data.length > 0) {
            therapistData = data[0];
          }
        } else {
          const { data } = await supabase.from("profiles").select("*").or(`office_domain.eq.${slug},id.eq.${slug}`).maybeSingle();
          if (data) {
            therapistData = data;
          }
        }
        if (!therapistData) {
          therapistData = {
            id: "guest",
            name: "Dra. Mariana Costa Silva",
            crp: "06/12345-SP",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
            bio: "Psicóloga Clínica especialista em Terapia Cognitivo-Comportamental (TCC). Foco no tratamento de ansiedade, depressão, estresse laboral e transições de carreira. Atendimento acolhedor e humanizado.",
            specialties: ["Ansiedade", "Depressão", "TCC", "Estresse"],
            session_value: 180,
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
  const psychologistId = therapist?.id || "guest";
  const sessionValue = therapist?.session_value || 150;
  const bookingRules = therapist?.booking_rules || {
    startHour: "08:00",
    endHour: "18:00",
    bufferMinutes: 15,
    lunchStart: "12:00",
    lunchEnd: "13:00",
    workDays: [1, 2, 3, 4, 5]
  };
  const availableDates = useMemo(() => {
    const dates = [];
    const today = /* @__PURE__ */ new Date();
    for (let i = 0; i < 14; i++) {
      const futureDate = /* @__PURE__ */ new Date();
      futureDate.setDate(today.getDate() + i);
      const dayOfWeek = futureDate.getDay();
      const isWorkingDay = (bookingRules.workDays || [1, 2, 3, 4, 5]).includes(dayOfWeek);
      if (isWorkingDay) {
        const yyyy = futureDate.getFullYear();
        const mm = String(futureDate.getMonth() + 1).padStart(2, "0");
        const dd = String(futureDate.getDate()).padStart(2, "0");
        dates.push({
          formatted: `${dd}/${mm}`,
          raw: `${yyyy}-${mm}-${dd}`,
          dayName: futureDate.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")
        });
      }
    }
    return dates;
  }, [bookingRules]);
  useEffect(() => {
    if (!selectedDate || psychologistId === "guest") return;
    const fetchOccupiedSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const { data, error } = await supabase.from("occupied_slots").select("time").eq("psychologist_id", psychologistId).eq("date", selectedDate);
        if (error) throw error;
        setOccupiedSlots(data || []);
      } catch (err) {
        console.error("Failed to load occupied slots:", err);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchOccupiedSlots();
    setSelectedTime("");
  }, [selectedDate, psychologistId]);
  const timeSlots = useMemo(() => {
    const slots = [];
    if (!selectedDate) return slots;
    const [startH, startM] = (bookingRules.startHour || "08:00").split(":").map(Number);
    const [endH, endM] = (bookingRules.endHour || "18:00").split(":").map(Number);
    const [lunchStartH, lunchStartM] = (bookingRules.lunchStart || "12:00").split(":").map(Number);
    const [lunchEndH, lunchEndM] = (bookingRules.lunchEnd || "13:00").split(":").map(Number);
    let current = /* @__PURE__ */ new Date();
    current.setHours(startH, startM, 0, 0);
    const end = /* @__PURE__ */ new Date();
    end.setHours(endH, endM, 0, 0);
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const isToday = selectedDate === todayStr;
    const now = /* @__PURE__ */ new Date();
    while (current < end) {
      const hh = String(current.getHours()).padStart(2, "0");
      const mm = String(current.getMinutes()).padStart(2, "0");
      const timeStr = `${hh}:${mm}`;
      const currentVal = current.getHours() * 60 + current.getMinutes();
      const lunchStartVal = lunchStartH * 60 + lunchStartM;
      const lunchEndVal = lunchEndH * 60 + lunchEndM;
      const isLunch = currentVal >= lunchStartVal && currentVal < lunchEndVal;
      let isPast = false;
      if (isToday) {
        const slotTime = /* @__PURE__ */ new Date();
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
  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !name || !email || !phone || !cpf) {
      setErrorMsg("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const { data: patientData, error: patientError } = await supabase.from("patients").insert({
        psychologist_id: psychologistId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        cpf: cpf.trim(),
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
        subscription_status: "inactive"
      }).select().single();
      if (patientError) throw patientError;
      const sanitizedPsychId = psychologistId.replace(/[^a-zA-Z0-9]/g, "");
      const uniqueApptId = Math.random().toString(36).substring(2, 10);
      const generatedRoomUrl = `https://meet.jit.si/PsychFlow_${sanitizedPsychId}_${uniqueApptId}`;
      const { data: apptData, error: apptError } = await supabase.from("appointments").insert({
        psychologist_id: psychologistId,
        patient_id: patientData.id,
        patient_name: name.trim(),
        patient_avatar: patientData.avatar,
        date: selectedDate,
        time: `${selectedTime}:00`,
        duration: 50,
        status: "requested",
        type: consultType,
        room_url: generatedRoomUrl
      }).select().single();
      if (apptError) throw apptError;
      setSuccessData({
        patientName: name.trim(),
        date: selectedDate.split("-").reverse().join("/"),
        time: selectedTime,
        type: consultType,
        roomUrl: generatedRoomUrl,
        sessionValue
      });
    } catch (err) {
      console.error("Booking Error:", err);
      setErrorMsg(err.message || "Houve um erro ao processar o seu agendamento.");
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoadingProfile) {
    return /* @__PURE__ */ jsxs("div", { className: "grid-layout", children: [
      /* @__PURE__ */ jsx("section", { className: "profile-column", children: /* @__PURE__ */ jsxs("div", { className: "profile-card glass-card shimmer-bg", children: [
        /* @__PURE__ */ jsx("div", { className: "shimmer-avatar" }),
        /* @__PURE__ */ jsx("div", { className: "shimmer-line title" }),
        /* @__PURE__ */ jsx("div", { className: "shimmer-line subtitle" }),
        /* @__PURE__ */ jsx("div", { className: "shimmer-line text" })
      ] }) }),
      /* @__PURE__ */ jsxs("section", { className: "booking-column glass-card flex-center", children: [
        /* @__PURE__ */ jsx("div", { className: "loading-spinner-circle" }),
        /* @__PURE__ */ jsx("p", { className: "loading-text-widget", children: "Carregando portal de agendamento seguro..." })
      ] })
    ] });
  }
  if (successData) {
    return /* @__PURE__ */ jsxs("div", { className: "success-card glass-card fade-in", children: [
      /* @__PURE__ */ jsxs("div", { className: "success-header", children: [
        /* @__PURE__ */ jsx("span", { className: "success-icon", children: "✨" }),
        /* @__PURE__ */ jsx("h3", { children: "Pré-Agendamento Concluído!" }),
        /* @__PURE__ */ jsx("p", { children: "Sua sessão foi enviada para confirmação com o profissional." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "summary-box", children: [
        /* @__PURE__ */ jsxs("div", { className: "summary-item", children: [
          /* @__PURE__ */ jsx("span", { children: "Paciente" }),
          /* @__PURE__ */ jsx("strong", { children: successData.patientName })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "summary-item", children: [
          /* @__PURE__ */ jsx("span", { children: "Data e Hora" }),
          /* @__PURE__ */ jsxs("strong", { children: [
            successData.date,
            " às ",
            successData.time
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "summary-item", children: [
          /* @__PURE__ */ jsx("span", { children: "Modalidade" }),
          /* @__PURE__ */ jsx("strong", { children: successData.type === "online" ? "🌐 Teleconsulta Online" : "🏢 Presencial (Consultório)" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "summary-item", children: [
          /* @__PURE__ */ jsx("span", { children: "Valor da Sessão" }),
          /* @__PURE__ */ jsxs("strong", { children: [
            "R$ ",
            successData.sessionValue
          ] })
        ] })
      ] }),
      successData.type === "online" && /* @__PURE__ */ jsxs("div", { className: "telehealth-box", children: [
        /* @__PURE__ */ jsx("h4", { children: "🛡️ Sala de Vídeo Segura" }),
        /* @__PURE__ */ jsx("p", { children: "Seu link exclusivo para a teleconsulta do Jitsi Meet já foi gerado:" }),
        /* @__PURE__ */ jsx("a", { href: successData.roomUrl, target: "_blank", rel: "noopener noreferrer", className: "jitsi-link-btn", children: "Acessar Sala da Consulta" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "payment-box", children: [
        /* @__PURE__ */ jsx("h4", { children: "💳 Confirmar Pagamento" }),
        /* @__PURE__ */ jsx("p", { children: "Realize o pagamento por PIX para garantir a reserva definitiva da sua vaga:" }),
        /* @__PURE__ */ jsxs("div", { className: "pix-wrapper", children: [
          /* @__PURE__ */ jsx("div", { className: "pix-qr", children: "QR Code PIX Simulador" }),
          /* @__PURE__ */ jsx("button", { className: "pix-btn", onClick: () => alert("Chave Copiada: pix-psychflow-mock-key"), children: "Copiar Chave PIX" })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "grid-layout fade-in", children: [
    /* @__PURE__ */ jsx("section", { className: "profile-column", children: /* @__PURE__ */ jsxs("div", { className: "profile-card glass-card", children: [
      /* @__PURE__ */ jsx("img", { src: therapist.avatar, alt: "Avatar do Psicólogo", className: "therapist-avatar" }),
      /* @__PURE__ */ jsx("h1", { className: "therapist-name", children: therapist.name }),
      /* @__PURE__ */ jsxs("span", { className: "therapist-crp", children: [
        "CRP ",
        therapist.crp || "Não Informado"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "separator" }),
      /* @__PURE__ */ jsx("p", { className: "therapist-bio", children: therapist.bio || "Sem descrição cadastrada." }),
      /* @__PURE__ */ jsxs("div", { className: "specialties-section", children: [
        /* @__PURE__ */ jsx("h4", { children: "Especialidades" }),
        /* @__PURE__ */ jsx("div", { className: "specialties-grid", children: (therapist.specialties || ["Psicoterapia Geral"]).map((spec) => /* @__PURE__ */ jsx("span", { className: "specialty-chip", children: spec }, spec)) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "separator" }),
      /* @__PURE__ */ jsx("div", { className: "price-section", children: /* @__PURE__ */ jsxs("div", { class: "price-box", children: [
        /* @__PURE__ */ jsx("span", { class: "price-label", children: "Valor da Sessão" }),
        /* @__PURE__ */ jsxs("h2", { className: "session-price", children: [
          "R$ ",
          sessionValue
        ] })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "booking-column glass-card", children: /* @__PURE__ */ jsxs("div", { className: "booking-widget", children: [
      /* @__PURE__ */ jsxs("div", { className: "step-container", children: [
        /* @__PURE__ */ jsx("h3", { className: "step-title", children: "1. Selecione o Dia" }),
        /* @__PURE__ */ jsx("div", { className: "dates-grid", children: availableDates.map((date) => /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: `date-chip ${selectedDate === date.raw ? "active" : ""}`,
            onClick: () => setSelectedDate(date.raw),
            children: [
              /* @__PURE__ */ jsx("span", { className: "date-day-name", children: date.dayName }),
              /* @__PURE__ */ jsx("span", { className: "date-formatted", children: date.formatted })
            ]
          },
          date.raw
        )) })
      ] }),
      selectedDate && /* @__PURE__ */ jsxs("div", { className: "step-container fade-in", children: [
        /* @__PURE__ */ jsx("h3", { className: "step-title", children: "2. Escolha o Horário" }),
        isLoadingSlots ? /* @__PURE__ */ jsx("div", { className: "loading-spinner", children: "Carregando horários..." }) : timeSlots.length === 0 ? /* @__PURE__ */ jsx("p", { className: "no-slots", children: "Nenhum horário disponível para este dia." }) : /* @__PURE__ */ jsx("div", { className: "slots-grid", children: timeSlots.map((time) => {
          const isOccupied = occupiedSlots.some((slot) => slot.time.substring(0, 5) === time);
          return /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              disabled: isOccupied,
              className: `time-chip ${selectedTime === time ? "active" : ""} ${isOccupied ? "occupied" : ""}`,
              onClick: () => !isOccupied && setSelectedTime(time),
              children: time
            },
            time
          );
        }) })
      ] }),
      selectedDate && selectedTime && /* @__PURE__ */ jsxs("form", { onSubmit: handleBooking, className: "booking-form glass-card fade-in", children: [
        /* @__PURE__ */ jsx("h3", { className: "form-header-title", children: "3. Detalhes de Contato" }),
        errorMsg && /* @__PURE__ */ jsx("div", { className: "error-alert", children: errorMsg }),
        /* @__PURE__ */ jsxs("div", { className: "input-group", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "patient-name", children: "Nome Completo *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "patient-name",
              type: "text",
              required: true,
              placeholder: "Digite seu nome completo",
              value: name,
              onChange: (e) => setName(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "input-grid", children: [
          /* @__PURE__ */ jsxs("div", { className: "input-group", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "patient-email", children: "E-mail *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "patient-email",
                type: "email",
                required: true,
                placeholder: "nome@exemplo.com",
                value: email,
                onChange: (e) => setEmail(e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "input-group", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "patient-phone", children: "Celular (WhatsApp) *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "patient-phone",
                type: "tel",
                required: true,
                placeholder: "(11) 99999-9999",
                value: phone,
                onChange: (e) => setPhone(e.target.value)
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "input-grid", children: [
          /* @__PURE__ */ jsxs("div", { className: "input-group", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "patient-cpf", children: "CPF (Faturamento) *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "patient-cpf",
                type: "text",
                required: true,
                placeholder: "123.456.789-00",
                value: cpf,
                onChange: (e) => setCpf(e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "input-group", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "consult-type", children: "Modalidade *" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                id: "consult-type",
                value: consultType,
                onChange: (e) => setConsultType(e.target.value),
                children: [
                  /* @__PURE__ */ jsx("option", { value: "online", children: "🌐 Online (Vídeo)" }),
                  /* @__PURE__ */ jsx("option", { value: "presencial", children: "🏢 Presencial (Consultório)" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "submit", disabled: isSubmitting, className: "submit-booking-btn", children: isSubmitting ? "Agendando..." : "Confirmar e Reservar Vaga" })
      ] })
    ] }) })
  ] });
};

const $$Astro = createAstro();
const $$slug = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Agendar Consulta", "description": "Escolha o melhor dia e hor\xE1rio para a sua sess\xE3o de psicoterapia segura e criptografada.", "data-astro-cid-yvbahnfj": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="booking-wrapper" data-astro-cid-yvbahnfj> <!-- Header/Logo Brand --> <header class="brand-header" data-astro-cid-yvbahnfj> <div class="brand-logo" data-astro-cid-yvbahnfj>Psych<span data-astro-cid-yvbahnfj>Flow</span></div> <div class="secure-badge-top" data-astro-cid-yvbahnfj>🔒 Ambiente Seguro e Criptografado</div> </header> ${renderComponent($$result2, "BookingCalendar", BookingCalendar, { "client:load": true, "slug": slug, "client:component-hydration": "load", "client:component-path": "C:/Users/HP/Documents/projetos alpha code/app para psic\xF3logos - react native/portal-paciente/src/components/BookingCalendar", "client:component-export": "BookingCalendar", "data-astro-cid-yvbahnfj": true })} </div> ` })}  `;
}, "C:/Users/HP/Documents/projetos alpha code/app para psic\xF3logos - react native/portal-paciente/src/pages/[slug].astro", void 0);

const $$file = "C:/Users/HP/Documents/projetos alpha code/app para psicólogos - react native/portal-paciente/src/pages/[slug].astro";
const $$url = "/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
