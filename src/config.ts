export const config = {
  flux: [
    {"id":"economie", "titre": "Économie", "url":"https://www.lemonde.fr/economie/rss_full.xml"},
    {"id":"politique", "titre":"Politique", "url":"https://www.lemonde.fr/politique/rss_full.xml"},
    {"id":"societe", "titre":"Société", "url":"https://www.lemonde.fr/societe/rss_full.xml"},
  ],
  tagline: "Un journal généré par GPT-3",
  rewrite_prompt: "Réécrit cette phrase: ",
  resume_prompt: "Résume ce texte: ",
  text_max_length: 2000,
}
