async function start() {
  try {
    await ensureBucket().catch((e) => {
      console.warn('MinIO unavailable, APK uploads disabled:', e.message);
    });
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`PeopleStore API listening on :${PORT}`);
    });
  } catch (e) {
    console.error('Failed to start', e);
    process.exit(1);
  }
}
