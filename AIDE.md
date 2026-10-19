# Aide de jeu — Super Star Trek

Ce guide décrit chaque écran de la console de l’USS Enterprise, les commandes disponibles et les règles du jeu.

## Sommaire

1. [Le but du jeu](#le-but-du-jeu)
2. [Ordres de mission (écran d’accueil)](#ordres-de-mission-écran-daccueil)
3. [Vue d’ensemble de la console](#vue-densemble-de-la-console)
4. [Barre supérieure](#barre-supérieure)
5. [Scan courte portée (écran principal)](#scan-courte-portée-écran-principal)
6. [Postes de commande](#postes-de-commande)
   - [NAV — Navigation](#nav--navigation)
   - [TOR — Torpilles](#tor--torpilles)
   - [PHA — Phasers](#pha--phasers)
   - [SHE — Boucliers](#she--boucliers)
   - [LRS — Scan longue portée](#lrs--scan-longue-portée)
   - [DAM — Avaries](#dam--avaries)
   - [COM — Ordinateur](#com--ordinateur)
7. [Archives galactiques (carte)](#archives-galactiques-carte)
8. [État du vaisseau](#état-du-vaisseau)
9. [Journal de bord et ligne de commande](#journal-de-bord-et-ligne-de-commande)
10. [Fin de mission](#fin-de-mission)
11. [Le système de cap](#le-système-de-cap)
12. [Raccourcis clavier](#raccourcis-clavier)
13. [Règles détaillées](#règles-détaillées)
14. [Conseils tactiques](#conseils-tactiques)

---

## Le but du jeu

Vous commandez l’USS Enterprise. Des croiseurs klingons ont envahi la galaxie : détruisez-les **tous** avant la date limite, sans perdre le vaisseau. Des bases stellaires vous permettent de refaire le plein d’énergie et de torpilles, et de réparer.

- La galaxie compte **8 × 8 quadrants**, chacun découpé en **8 × 8 secteurs**.
- Chaque nouvelle partie tire au hasard le nombre de Klingons, de bases, d’étoiles et la durée de la mission (25 à 34 jours, ou plus s’il y a beaucoup de Klingons).

---

## Ordres de mission (écran d’accueil)

Au lancement, une fenêtre présente votre mission :

- le **nombre de croiseurs klingons** à détruire ;
- la **date stellaire limite** à laquelle ils attaqueront le quartier général de la Fédération ;
- le **nombre de jours** dont vous disposez ;
- le **nombre de bases stellaires** disponibles ;
- trois conseils de base.

Cliquez **Accepter la mission** (ou appuyez sur Entrée) pour prendre les commandes.

---

## Vue d’ensemble de la console

La console reprend le style des écrans de Starfleet. Elle se divise en cinq zones :

| Zone | Emplacement | Rôle |
| --- | --- | --- |
| Barre supérieure | En haut | Date, temps restant, condition d’alerte, son, nouvelle mission |
| Barre des postes | À gauche | Boutons NAV, TOR, PHA, SHE, LRS, DAM, COM |
| Scan courte portée | Au centre, en haut | Le quadrant où se trouve l’Enterprise |
| Poste actif | Au centre, en bas | Les réglages de la commande choisie |
| Colonne de droite | À droite | Archives galactiques, état du vaisseau, journal de bord |

La couleur générale de la console suit la condition d’alerte (verte, jaune, rouge ou amarré).

---

## Barre supérieure

| Élément | Signification |
| --- | --- |
| **USS Enterprise NCC-1701** | Le nom du vaisseau |
| **Date stellaire** | La date actuelle. Chaque déplacement la fait avancer |
| **Jours restants** | Le temps qu’il reste avant la date limite |
| **Condition** | L’état d’alerte (voir ci-dessous) |
| **Son actif / Son coupé** | Active ou coupe les effets sonores. Le choix est mémorisé |
| **Nouvelle mission** | Abandonne la partie en cours (après confirmation) et en lance une nouvelle |

Les conditions d’alerte :

| Condition | Quand |
| --- | --- |
| **Amarré** | L’Enterprise est amarré à une base stellaire |
| **Condition rouge** | Au moins un croiseur klingon est présent dans le quadrant |
| **Condition jaune** | L’énergie est inférieure à 10 % (moins de 300 unités) |
| **Condition verte** | Aucun danger immédiat |

---

## Scan courte portée (écran principal)

L’écran central montre le quadrant actuel, 8 × 8 secteurs. L’en-tête indique le nom du quadrant et la position de l’Enterprise (ligne, colonne).

### Ce qu’on y voit

| Objet | Description |
| --- | --- |
| **Enterprise** | Votre vaisseau, orienté selon le dernier cap |
| **Croiseur klingon** | Un ennemi à détruire |
| **Étoile** | Un obstacle : elle bloque les déplacements et absorbe les torpilles |
| **Base stellaire** | Le point de ravitaillement et de réparation |

### Interactions

- **Survoler une case** affiche une bulle : ce qu’elle contient, le cap pour l’atteindre et la distance en secteurs.
- **Cliquer un croiseur klingon** ouvre le poste **TOR** avec le cap de tir déjà calculé.
- **Cliquer une case vide, une étoile ou la base** ouvre le poste **NAV** avec le cap et le facteur warp qu’il faut pour s’y rendre (en s’arrêtant devant l’objet si la case est occupée).
- Quand le poste TOR est ouvert, un clic sur n’importe quelle case règle le cap de tir.
- Quand NAV ou TOR est ouvert, une **ligne de visée** montre la trajectoire prévue.

Ces aides de visée exigent un ordinateur de bord en état de marche.

### Vue 2D / Vue 3D

Le bouton **Vue 2D / Vue 3D** dans l’en-tête change de rendu. Le choix est mémorisé.

- **Vue 3D** : glissez pour faire pivoter la caméra, double-cliquez pour la recentrer.
- **Vue 2D** : une carte vue de dessus, plus lisible sur les petits écrans.

La vue 3D n’apparaît que si le navigateur prend en charge WebGL.

### Senseurs endommagés

Si les **senseurs courte portée** sont en panne, l’écran affiche « Senseurs courte portée hors service » : seule la position de l’Enterprise est connue. Les Klingons, les étoiles et la base deviennent invisibles.

---

## Postes de commande

La barre de gauche ouvre un poste à la fois dans la moitié basse de l’écran central. Chaque bouton porte un code à trois lettres, celui des commandes du jeu BASIC d’origine. Les boutons d’action sont grisés pendant une animation ou quand le système est hors service.

### NAV — Navigation

Pour déplacer l’Enterprise dans le quadrant ou d’un quadrant à l’autre.

| Élément | Rôle |
| --- | --- |
| **Cadran de cap** | Cliquez ou glissez pour choisir la direction (voir [le système de cap](#le-système-de-cap)) |
| **Champ Cap** | Saisie directe du cap, de 1 à 8,99 |
| **Facteur warp** | Curseur de 0,1 à 8 |
| **Distance** | Le trajet en secteurs (warp < 1) ou en quadrants (warp ≥ 1) |
| **Énergie** | Le coût du trajet. En rouge si la réserve ne suffit pas |
| **Durée** | Le temps consommé en jours |
| **Engager** | Lance le déplacement |

- Un facteur warp de **1** fait parcourir **8 secteurs**, soit un quadrant. Un warp de 0,5 fait 4 secteurs.
- Le vaisseau s’arrête devant une étoile, une base ou un croiseur qui barre la route.
- Il est impossible de franchir le bord de la galaxie : les moteurs se coupent au périmètre.
- Si les **moteurs warp** sont endommagés, la vitesse est limitée à warp 0,2.

### TOR — Torpilles

Pour tirer une torpille à photons en ligne droite.

| Élément | Rôle |
| --- | --- |
| **Cadran de cap** | La direction du tir |
| **Champ Cap** | Saisie directe du cap |
| **Voyants** | Les torpilles restantes (10 au maximum) |
| **Feu** | Tire la torpille |

- Une torpille **détruit d’un coup** le premier croiseur klingon qu’elle touche.
- Une étoile sur la trajectoire **absorbe** la torpille.
- Attention : une torpille qui touche une **base stellaire la détruit**.
- Chaque tir coûte une torpille et 2 unités d’énergie. Le journal affiche la trajectoire secteur par secteur.
- Le plus simple pour viser : cliquer le croiseur sur l’écran principal.

### PHA — Phasers

Pour frapper **tous** les croiseurs du quadrant en même temps avec l’énergie du vaisseau.

| Élément | Rôle |
| --- | --- |
| **Énergie à tirer** | Curseur de 0 à votre réserve, par pas de 10 |
| **Préréglages** | Boutons 100, 250, 500, 1000 |
| **Liste des cibles** | Chaque Klingon, sa distance et une estimation des dégâts |
| **Tirer les phasers** | Lance le tir |

- L’énergie est **répartie à parts égales** entre tous les croiseurs présents.
- Les dégâts **faiblissent avec la distance** : rapprochez-vous pour être efficace.
- Un coup trop faible (moins de 15 % de l’énergie du croiseur) ne lui fait rien.
- Un croiseur dispose de 100 à 300 unités d’énergie au départ.
- Si l’**ordinateur de bord** est en panne, la précision du tir diminue.

### SHE — Boucliers

Pour répartir l’énergie entre la réserve et les boucliers.

| Élément | Rôle |
| --- | --- |
| **Boucliers** | Curseur de 0 au total (réserve + boucliers actuels) |
| **Barre de répartition** | La part de l’énergie affectée aux boucliers |
| **Boucliers / Réserve** | Les valeurs après transfert |
| **Transférer l’énergie** | Applique le réglage |

- Les boucliers absorbent les tirs klingons. **À zéro, le premier tir est fatal.**
- Le transfert ne coûte ni temps ni énergie.
- L’énergie mise dans les boucliers n’est plus disponible pour les déplacements ni les phasers.
- À l’amarrage, les boucliers sont abaissés à zéro, mais la base vous protège.
- Le curseur repart de la valeur réelle des boucliers à chaque ouverture du poste.

### LRS — Scan longue portée

Pour connaître le contenu des huit quadrants autour du vôtre.

- Le bouton **Lancer le scan** affiche une grille 3 × 3 dont le centre est votre quadrant.
- Chaque case porte un code à trois chiffres **K B S** : Klingons, bases, étoiles. Par exemple `207` = 2 Klingons, 0 base, 7 étoiles.
- `***` désigne une zone hors de la galaxie. `···` signifie que le scan n’a pas encore été fait depuis ce quadrant.
- Les résultats sont enregistrés dans les [archives galactiques](#archives-galactiques-carte).
- Le scan ne coûte **ni temps ni énergie** : lancez-le à chaque nouveau quadrant.

### DAM — Avaries

Pour suivre l’état des huit systèmes du vaisseau :

| Système | Effet d’une panne |
| --- | --- |
| Moteurs warp | Vitesse limitée à warp 0,2 |
| Senseurs courte portée | L’écran principal ne montre plus que l’Enterprise |
| Senseurs longue portée | Scan longue portée impossible |
| Contrôle des phasers | Phasers inutilisables |
| Tubes lance-torpilles | Torpilles inutilisables |
| Contrôle des avaries | Rapport d’avaries indisponible (sauf amarré) |
| Contrôle des boucliers | Boucliers bloqués à leur niveau actuel |
| Ordinateur de bord | Carte galactique, poste COM et aides de visée indisponibles ; phasers moins précis |

- Chaque système affiche **Opérationnel** ou le nombre de **jours de réparation** restants.
- Les systèmes se réparent peu à peu pendant les déplacements.
- **Amarré** à une base, le bouton **Autoriser les réparations** remet tout en état d’un coup, pour moins d’un jour.

### COM — Ordinateur

L’ordinateur de bord regroupe trois rapports :

| Section | Contenu |
| --- | --- |
| **Rapport de situation** | Klingons restants, jours restants, bases restantes, condition |
| **Données de tir** | Le cap vers chaque Klingon du quadrant. **Viser** ouvre TOR avec ce cap |
| **Navigation vers la base** | Le cap et le warp pour rejoindre la base du quadrant. **Tracer la route** ouvre NAV avec ces réglages |

La case **Afficher les noms des régions sur la carte** remplace les codes des archives galactiques par les noms des régions.

Si l’ordinateur est en panne, le poste affiche « Ordinateur de bord hors service ».

---

## Archives galactiques (carte)

En haut de la colonne de droite, la carte montre les 64 quadrants de la galaxie.

- Chaque quadrant **visité ou scanné** affiche son code **K B S** (Klingons, bases, étoiles). Les chiffres K et B s’allument quand ils ne sont pas nuls.
- Un quadrant inconnu affiche `···`.
- Votre quadrant actuel est mis en évidence, ceux qui abritent des Klingons sont signalés comme hostiles.
- Une séparation verticale divise la galaxie en deux moitiés, ouest et est.
- **Survoler un quadrant** affiche son nom, son contenu connu, le cap et le facteur warp pour l’atteindre.
- **Cliquer un quadrant** ouvre le poste NAV avec le cap et le warp déjà réglés.

### Noms des régions

Chaque ligne de la galaxie porte deux noms d’étoile, un par moitié, suivis d’un chiffre romain de I à IV :

| Ligne | Moitié ouest | Moitié est |
| --- | --- | --- |
| 1 | Antarès | Sirius |
| 2 | Rigel | Deneb |
| 3 | Procyon | Capella |
| 4 | Véga | Bételgeuse |
| 5 | Canopus | Aldébaran |
| 6 | Altaïr | Régulus |
| 7 | Sagittaire | Arcturus |
| 8 | Pollux | Spica |

Par exemple, « Rigel III » est le troisième quadrant de la ligne 2, et « Deneb III » le septième.

Si l’ordinateur est en panne, les archives sont inaccessibles.

---

## État du vaisseau

Sous la carte, ce panneau résume les ressources :

| Élément | Signification |
| --- | --- |
| **Légende** | « Tous systèmes opérationnels » ou le nombre de systèmes endommagés |
| **Énergie** | La réserve, sur 3000. La jauge vire au rouge sous 10 % |
| **Boucliers** | L’énergie affectée aux boucliers, sur 3000 |
| **Torpilles** | Un voyant par torpille restante, sur 10 |
| **Klingons** | Les croiseurs restants sur le total de départ |
| **Bases** | Les bases stellaires encore debout |

---

## Journal de bord et ligne de commande

Le journal affiche, du plus ancien au plus récent, tous les messages de l’équipage : tirs, impacts, avaries, réparations, entrées dans un quadrant. Les couleurs indiquent la nature du message (information, alerte, danger, succès, ordinateur).

Sous le journal, le champ **Commande** accepte les commandes texte du jeu de 1978. Tapez-les puis appuyez sur Entrée :

| Commande | Exemple | Effet |
| --- | --- | --- |
| `NAV cap warp` | `NAV 3 1` | Se déplacer |
| `TOR cap` | `TOR 4.5` | Tirer une torpille |
| `PHA énergie` | `PHA 500` | Tirer les phasers |
| `SHE unités` | `SHE 800` | Régler les boucliers |
| `LRS` | `LRS` | Scan longue portée |
| `SRS` | `SRS` | Rappelle que le scan courte portée est toujours affiché |
| `DAM` | `DAM` | Ouvrir le poste Avaries |
| `COM` | `COM` | Ouvrir l’ordinateur |
| `XXX` | `XXX` | Abandonner et recommencer, sans confirmation |

Les majuscules ne comptent pas. Les arguments peuvent être séparés par des espaces, des virgules ou des points-virgules. Une commande inconnue affiche la liste des commandes.

---

## Fin de mission

Une fenêtre s’affiche sur l’écran principal à la fin de la partie, avec un bouton **Nouvelle mission**.

**Victoire** — le dernier Klingon est détruit. Le message indique la durée de la mission et un **indice d’efficacité** : 1000 × (Klingons détruits ÷ jours écoulés)². Plus vous êtes rapide, plus il est élevé.

**Défaites possibles** :

| Titre | Cause |
| --- | --- |
| **L’Enterprise a été détruit** | Les boucliers sont tombés à zéro sous le feu klingon |
| **Le temps est écoulé** | La date limite est dépassée |
| **Vaisseau à la dérive** | Il ne reste presque plus d’énergie (boucliers + réserve ≤ 10) |
| **Relevé de votre commandement** | Vous avez détruit la dernière base stellaire de la galaxie |

---

## Le système de cap

Le cap reprend la boussole du jeu BASIC : un nombre de **1 à 9** (9 revient à 1).

```
        4   3   2
         \  |  /
      5 ─── ✦ ─── 1
         /  |  \
        6   7   8
```

| Cap | Direction |
| --- | --- |
| 1 | Est (droite) |
| 2 | Nord-est |
| 3 | Nord (haut) |
| 4 | Nord-ouest |
| 5 | Ouest (gauche) |
| 6 | Sud-ouest |
| 7 | Sud (bas) |
| 8 | Sud-est |

Les valeurs décimales donnent les directions intermédiaires : 1,5 est entre l’est et le nord-est. Le jeu interpole entre les huit directions, comme l’original, au lieu d’utiliser un angle exact. Le calculateur de cap intégré (clic sur une case, poste COM) tient compte de ce détail.

Sur le cadran, au clavier : flèches gauche/haut pour augmenter le cap de 0,1, flèches droite/bas pour le diminuer. Avec Maj, le pas passe à 1.

---

## Raccourcis clavier

| Touche | Action |
| --- | --- |
| `N` | Poste Navigation |
| `T` | Poste Torpilles |
| `P` | Poste Phasers |
| `S` | Poste Boucliers |
| `L` | Poste Scan longue portée |
| `D` | Poste Avaries |
| `C` | Poste Ordinateur |
| `Entrée` | Exécuter la commande du poste ouvert (Engager, Feu, Tirer, Transférer, Lancer le scan) |
| Flèches | Tourner le cadran de cap quand il a le focus |

Les raccourcis sont ignorés pendant la saisie dans un champ de texte (champ Commande, champ Cap).

---

## Règles détaillées

### Temps

- Un déplacement à warp 1 ou plus dure **1 jour**.
- En dessous de warp 1, il dure autant de jours que le facteur warp, arrondi au dixième inférieur : warp 0,55 = 0,5 jour.
- Les réparations à la base prennent moins d’un jour.
- Les tirs, les boucliers et les scans ne prennent pas de temps.

### Énergie

- La réserve de départ est de **3000 unités**.
- Un déplacement coûte **(secteurs parcourus + 10)** unités. Si la réserve ne suffit pas, les boucliers fournissent le complément.
- Une torpille coûte 2 unités. Les phasers coûtent l’énergie tirée.

### Amarrage

- Il suffit de se placer sur une case **voisine** de la base, diagonales comprises.
- L’amarrage remplit l’énergie (3000) et les torpilles (10), et abaisse les boucliers à zéro.
- Tant que vous êtes amarré, les tirs klingons ne vous atteignent pas.

### Combat

- Après chacun de vos tirs (phasers ou torpille), les Klingons encore en vie **ripostent**.
- Quand vous quittez un quadrant ou vous y déplacez, les Klingons **changent de position et tirent** avant votre départ.
- Leurs tirs faiblissent avec la distance, et chaque tir épuise une partie de leur énergie.
- Un impact supérieur ou égal au niveau des boucliers **détruit l’Enterprise**.
- Un impact puissant peut **endommager un système** au hasard.
- Pendant les déplacements, un incident peut aussi survenir : une panne, ou au contraire une réparation accélérée.

---

## Conseils tactiques

- **Montez les boucliers avant d’entrer dans un quadrant hostile.** 500 à 1000 unités sont un bon début.
- **Lancez un scan longue portée à chaque nouveau quadrant** : il est gratuit et remplit la carte.
- **Privilégiez les torpilles** contre un croiseur isolé : un coup au but suffit.
- **Rapprochez-vous avant de tirer les phasers** : leur puissance baisse avec la distance.
- **Ne tirez pas de torpille quand une base est dans l’axe.**
- **Surveillez les jours restants** : un quadrant traversé, c’est un jour de moins.
- **Revenez à une base** quand l’énergie passe sous 1000 ou que plusieurs systèmes sont en panne.
- Cliquer sur l’écran principal ou sur la carte calcule le cap pour vous : c’est le moyen le plus rapide de jouer.
