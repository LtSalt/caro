/// <reference path="../pb_data/types.d.ts" />

cronAdd("cleanup_deleted_expenses", "0 3 * * *", function () {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().replace("T", " ").substring(0, 19);

    const records = $app.findRecordsByFilter(
        "expenses",
        `deleted_at != "" && deleted_at <= "${cutoffStr}"`,
        "", 0, 0
    );
    for (const record of records) {
        $app.delete(record);
    }
});
