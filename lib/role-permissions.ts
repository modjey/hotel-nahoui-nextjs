/**
 * Description des rôles et de leurs permissions, affichée dans Admin → Rôles & permissions.
 * À garder alignée avec les contrôles réels : withAuth({ roles }) des routes /api/admin,
 * lib/admin-access.ts (sections ouvertes aux modérateurs) et app/api/admin/admin-users.
 */
export type RoleKey = "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";

export const ROLES: { key: RoleKey; label: string; summary: string }[] = [
  {
    key: "SUPER_ADMIN",
    label: "Super admin",
    summary: "Accès complet. Seul rôle qui gère les comptes administrateurs et peut supprimer des comptes.",
  },
  {
    key: "ADMIN",
    label: "Administrateur",
    summary: "Gère l'hôtel au quotidien : réservations, encaissements, chambres, tarifs, contenus et clients.",
  },
  {
    key: "MODERATOR",
    label: "Modérateur",
    summary: "Traite les messages clients et publie les actualités. N'a pas accès aux réservations ni aux paiements.",
  },
  {
    key: "USER",
    label: "Client",
    summary: "Compte du site public, créé à la première demande de réservation. Aucun accès à l'administration.",
  },
];

export type PermissionRow = { area: string; detail: string; roles: RoleKey[] };
export type PermissionGroup = { title: string; rows: PermissionRow[] };

const STAFF: RoleKey[] = ["ADMIN", "SUPER_ADMIN"];
const ALL_STAFF: RoleKey[] = ["MODERATOR", "ADMIN", "SUPER_ADMIN"];

export const PERMISSIONS: PermissionGroup[] = [
  {
    title: "Réservations & encaissements",
    rows: [
      { area: "Tableau de bord & notifications", detail: "Chiffres clés, nouvelles demandes, alertes", roles: STAFF },
      { area: "Réservations", detail: "Voir, créer, confirmer, annuler, relancer le client", roles: STAFF },
      { area: "Paiements", detail: "Enregistrer un acompte ou un solde, proforma", roles: STAFF },
      { area: "Devis groupes & séminaires", detail: "Traiter et envoyer les devis", roles: STAFF },
      { area: "Avis clients", detail: "Approuver, masquer ou supprimer un avis", roles: STAFF },
      { area: "Messages & réclamations", detail: "Lire, répondre, changer le statut", roles: ALL_STAFF },
    ],
  },
  {
    title: "Chambres & tarifs",
    rows: [
      { area: "Chambres & types", detail: "Fiches, photos, équipements, prix de base", roles: STAFF },
      { area: "Tarifs saisonniers", detail: "Prix par période, séjour minimum", roles: STAFF },
      { area: "Fermetures de chambres", detail: "Bloquer une chambre (travaux, maintenance)", roles: STAFF },
      { area: "Localisations", detail: "Adresses et informations des sites", roles: STAFF },
    ],
  },
  {
    title: "Site & marketing",
    rows: [
      { area: "Offres, événements, espaces, plats", detail: "Contenus affichés sur le site", roles: STAFF },
      { area: "Albums, photos & médias", detail: "Bibliothèque d'images, validation des photos envoyées", roles: STAFF },
      { area: "Actualités", detail: "Rédiger, publier, supprimer un article", roles: ALL_STAFF },
      { area: "Réglages du Photobook", detail: "Activation et règles d'envoi de photos", roles: ALL_STAFF },
      { area: "Paramètres du site", detail: "Accueil, contacts, mentions de la proforma", roles: STAFF },
    ],
  },
  {
    title: "Comptes",
    rows: [
      { area: "Clients et modérateurs", detail: "Créer, modifier, désactiver, réinitialiser le mot de passe", roles: STAFF },
      { area: "Administrateurs", detail: "Créer, nommer, modifier ou désactiver un administrateur", roles: ["SUPER_ADMIN"] },
      { area: "Supprimer un compte", detail: "Suppression définitive (jamais un super admin)", roles: ["SUPER_ADMIN"] },
    ],
  },
  {
    title: "Site public",
    rows: [
      { area: "Demande de réservation", detail: "Sans code ni mot de passe ; compte créé en coulisse", roles: ["USER", ...ALL_STAFF] },
      { area: "Mes réservations", detail: "Suivre ou annuler ses demandes (connexion par code email)", roles: ["USER", ...ALL_STAFF] },
      { area: "Avis & Photobook", detail: "Laisser un avis après séjour, proposer des photos (validées avant publication)", roles: ["USER", ...ALL_STAFF] },
    ],
  },
];

export const SECURITY_RULES: string[] = [
  "Un client (rôle Client) qui ouvre /admin est renvoyé sur le site.",
  "Un modérateur qui ouvre une autre section de l'admin est renvoyé vers les messages.",
  "Les restrictions sont vérifiées par le serveur à chaque action, pas seulement dans le menu.",
  "Un administrateur ne peut ni changer son propre rôle ni désactiver son propre compte.",
  "Il reste toujours au moins un super admin actif : le dernier ne peut être ni rétrogradé ni désactivé.",
  "Un changement de rôle ou une désactivation déconnecte la personne immédiatement.",
];
