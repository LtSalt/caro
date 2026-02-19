/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const groups = app.findCollectionByNameOrId("groups");
    groups.fields.add(
      new Field({
        name: "invited",
        type: "relation",
        required: false,
        collectionId: "_pb_users_auth_",
        maxSelect: 999,
        cascadeDelete: false,
      })
    );
    app.save(groups);
  },
  (app) => {
    const groups = app.findCollectionByNameOrId("groups");
    groups.fields.removeByName("invited");
    app.save(groups);
  }
);
