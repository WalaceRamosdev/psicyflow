/**
 * WhatsApp Message Templates for PsychFlow
 * 
 * Provides psychologically optimized scripts designed to minimize friction,
 * avoid defensiveness in scheduling, and speed up payment confirmation.
 */

export const whatsappTemplates = {
  /**
   * Passive-aggressive reminders cause evasion.
   * This template uses active choice (confirm or reschedule) to drive quick responses.
   */
  cobrarConfirmacao(patientName: string, time: string): string {
    const firstName = patientName.split(" ")[0];
    const message = `Olá, ${firstName}! Tudo bem? 🌿\n\nEstou organizando a agenda de atendimentos de amanhã. Posso confirmar o nosso horário das ${time}, ou você prefere remarcar para outro dia?`;
    return encodeURIComponent(message);
  },

  /**
   * A gentle message to send payment links without creating pressure.
   */
  enviarLinkPagamento(patientName: string, amount: string): string {
    const firstName = patientName.split(" ")[0];
    const message = `Olá, ${firstName}! Para facilitar a organização financeira do nosso ciclo, aqui está o link do seu pacote de sessões (${amount}):\n\n🔗 https://checkout.psychflow.com/pay/session_${Math.random().toString(36).substring(7)}`;
    return encodeURIComponent(message);
  }
};
