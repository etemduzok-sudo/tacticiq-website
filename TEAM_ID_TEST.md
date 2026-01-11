# 🔍 API-Football Team ID Testi

Console'da çalıştırın:

```javascript
// Test 1: Backend'den Fenerbahçe bilgilerini iste
fetch('http://localhost:3000/api/teams/search?name=Fenerbahce')
  .then(r => r.json())
  .then(d => {
    console.log('🔍 Fenerbahçe Arama Sonucu:', d);
    if (d.data && d.data.length > 0) {
      d.data.forEach(team => {
        console.log(`  - ${team.name} (ID: ${team.id}) - ${team.country}`);
      });
    }
  });

// Test 2: ID 548 hangi takım?
fetch('http://localhost:3000/api/teams/548')
  .then(r => r.json())
  .then(d => {
    console.log('🔍 ID 548:', d);
  });
```

Sonuçları bekleyin!
