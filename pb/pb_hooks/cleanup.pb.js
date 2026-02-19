/// <reference path="../pb_data/types.d.ts" />

cronAdd("cleanup_deleted_expenses", "0 3 * * *", function () {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().replace("T", " ").substring(0, 19);

    const deleted = $app.findRecordsByFilter(
        "expenses",
        `deleted_at != "" && deleted_at <= "${cutoffStr}"`,
        "", 0, 0
    );
    for (const record of deleted) {
        $app.delete(record);
    }

    const settled = $app.findRecordsByFilter(
        "expenses",
        `settled = true && settled_at != "" && settled_at <= "${cutoffStr}"`,
        "", 0, 0
    );
    for (const record of settled) {
        $app.delete(record);
    }
});
