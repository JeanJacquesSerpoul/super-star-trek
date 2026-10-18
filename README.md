# Super Star Trek

Le jeu *Star Trek* écrit en BASIC dans les années 1970, refait avec React, TypeScript et three.js.

**Jouer :** https://jeanjacquesserpoul.github.io/super-star-trek/

## Le jeu

Vous commandez l’USS Enterprise. Détruisez tous les croiseurs klingons de la galaxie avant la date limite, en vous ravitaillant aux bases stellaires.

- La galaxie compte 8 × 8 quadrants, chacun de 8 × 8 secteurs.
- Le cap va de 1 (est) à 9, en passant par 3 (nord), 5 (ouest) et 7 (sud).
- Un facteur warp de 1 fait parcourir un quadrant.
- Avec des boucliers à zéro, le premier tir klingon est fatal.

Commandes (boutons, raccourcis clavier ou ligne de commande) :

| Commande | Rôle |
| --- | --- |
| `NAV cap warp` | Se déplacer |
| `TOR cap` | Tirer une torpille à photons |
| `PHA énergie` | Tirer les phasers sur tous les ennemis du quadrant |
| `SHE unités` | Régler les boucliers |
| `LRS` | Scanner les quadrants voisins |
| `DAM` | Afficher les avaries |
| `COM` | Ouvrir l’ordinateur de bord |

Les règles reprennent *Super Star Trek* de Bob Leedom (1974), dérivé du *Star Trek* de Mike Mayfield (1971) et publié par David Ahl.

## Développement

```bash
npm install
npm run dev
```

`npm run build` produit le site dans `dist/`. Chaque push sur `main` le déploie sur GitHub Pages.
