/// <reference path="../pb_data/types.d.ts" />

const autoFields = [
  { name: "created", type: "autodate", onCreate: true, onUpdate: false },
  { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
];

migrate(
  (app) => {
    // ── Update built-in users collection ──
    const users = app.findCollectionByNameOrId("_pb_users_auth_");
    users.listRule = '@request.auth.id != ""';
    users.viewRule = '@request.auth.id != ""';
    // Make email visible so authenticated users can search by email
    const emailField = users.fields.find((f) => f.name === "email");
    if (emailField) {
      emailField.hidden = false;
    }
    app.save(users);

    // ── groups ──
    const groups = new Collection({
      name: "groups",
      type: "base",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "description", type: "text", required: false },
        {
          name: "currency",
          type: "select",
          required: true,
          values: ["EUR", "USD", "GBP", "CHF"],
          maxSelect: 1,
        },
        {
          name: "created_by",
          type: "relation",
          required: true,
          collectionId: "_pb_users_auth_",
          maxSelect: 1,
          cascadeDelete: false,
        },
        ...autoFields,
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != "" && @request.auth.id = created_by',
      deleteRule: '@request.auth.id != "" && @request.auth.id = created_by',
    });
    app.save(groups);

    // ── group_members ──
    const groupMembers = new Collection({
      name: "group_members",
      type: "base",
      fields: [
        {
          name: "group",
          type: "relation",
          required: true,
          collectionId: groups.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: "user",
          type: "relation",
          required: true,
          collectionId: "_pb_users_auth_",
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: "role",
          type: "select",
          required: true,
          values: ["owner", "member"],
          maxSelect: 1,
        },
        ...autoFields,
      ],
      indexes: ['CREATE UNIQUE INDEX idx_group_user ON group_members ("group", "user")'],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    });
    app.save(groupMembers);

    // ── expenses ──
    const expenses = new Collection({
      name: "expenses",
      type: "base",
      fields: [
        {
          name: "group",
          type: "relation",
          required: true,
          collectionId: groups.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: "description", type: "text", required: true },
        { name: "amount", type: "number", required: true, min: 0.01 },
        {
          name: "paid_by",
          type: "relation",
          required: true,
          collectionId: "_pb_users_auth_",
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: "split_type",
          type: "select",
          required: true,
          values: ["equal", "exact", "percentage"],
          maxSelect: 1,
        },
        { name: "date", type: "date", required: true },
        {
          name: "created_by",
          type: "relation",
          required: true,
          collectionId: "_pb_users_auth_",
          maxSelect: 1,
          cascadeDelete: false,
        },
        ...autoFields,
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    });
    app.save(expenses);

    // ── expense_splits ──
    const expenseSplits = new Collection({
      name: "expense_splits",
      type: "base",
      fields: [
        {
          name: "expense",
          type: "relation",
          required: true,
          collectionId: expenses.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: "user",
          type: "relation",
          required: true,
          collectionId: "_pb_users_auth_",
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: "amount", type: "number", required: true, min: 0 },
        ...autoFields,
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    });
    app.save(expenseSplits);

    // ── settlements ──
    const settlements = new Collection({
      name: "settlements",
      type: "base",
      fields: [
        {
          name: "group",
          type: "relation",
          required: true,
          collectionId: groups.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: "paid_by",
          type: "relation",
          required: true,
          collectionId: "_pb_users_auth_",
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: "paid_to",
          type: "relation",
          required: true,
          collectionId: "_pb_users_auth_",
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: "amount", type: "number", required: true, min: 0.01 },
        { name: "date", type: "date", required: true },
        ...autoFields,
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    });
    app.save(settlements);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId("settlements"));
    app.delete(app.findCollectionByNameOrId("expense_splits"));
    app.delete(app.findCollectionByNameOrId("expenses"));
    app.delete(app.findCollectionByNameOrId("group_members"));
    app.delete(app.findCollectionByNameOrId("groups"));
  }
);
