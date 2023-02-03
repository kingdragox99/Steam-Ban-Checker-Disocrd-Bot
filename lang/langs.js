//TODO Review translation

// text = text send by bot to discord
// console = text print in console
// command = input command on discord

const lang = {
  command: {
    text_lang_fr: "Votre bot est maintenant en français",
    text_lang_en: "Your bot is now in English",
    text_lang_es: "Tu bot está ahora en español",
    text_lang_error:
      "Your language is not yet implemented we put you in English for the moment",
    command_lang_fr: "!setup lang fr",
    command_lang_en: "!setup lang en",
    command_lang_es: "!setup lang es",
  },
  fr_FR: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot surveille :",
    command_ping: "!ping",
    response_ping: "pong",
    command_input: "!setup input",
    text_input: "Ce channel est le nouveau channel d'entrée",
    command_output: "!setup output",
    text_output: "Ce channel est le nouveau channel de sortie",
    error_command: "Votre message n'est pas un URL ou une commande valide",
    response_ban: "Valve à fais son travail une pute a été trouvée",
  },
  en_EN: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot watches:",
    command_ping: "!ping",
    response_ping: "pong",
    command_input: "!setup input",
    text_input: "This channel is the new input channel",
    command_output: "!setup output",
    text_output: "This channel is the new output channel",
    error_command: "Your message is not a valid URL or command",
    response_ban: "Valve has done its job a slut has been found",
  },
  es_ES: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot monitor:",
    command_ping: "!ping",
    response_ping: "pong",
    command_input: "!setup input",
    text_input: "Este canal es el nuevo canal de entrada",
    command_output: "!setup output",
    text_output: "Este canal es el nuevo canal de salida",
    error_command: "Su mensaje no es una URL u comando válida",
    response_ban: "Valve ha hecho su trabajo una puta ha sido encontrado",
  },
};

module.exports = lang;
