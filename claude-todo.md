### Database
- [ ] Créer `database.py` (connexion SQLite, `SessionLocal`)
- [ ] Créer `models.py` :
  - [ ] Modèle `Routine` (id, nom, date)
  - [ ] Modèle `RoutineStep` (id, routine_id, nom, code_map, durée, tips)
- [ ] Exécuter `Base.metadata.create_all`