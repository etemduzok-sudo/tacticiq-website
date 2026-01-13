# SHA-1 Fingerprint Guide - TacticIQ

## Android SHA-1 Fingerprint Üretme

SHA-1 parmak izini üretmek için Java JDK gereklidir.

### Adımlar:

1. **Java JDK Yükleyin** (eğer yüklü değilse):
   - [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) veya
   - [OpenJDK](https://openjdk.org/) indirin ve yükleyin

2. **JAVA_HOME Ortam Değişkenini Ayarlayın**:
   ```powershell
   # PowerShell'de (Admin olarak çalıştırın)
   [System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Java\jdk-XX', 'Machine')
   ```

3. **Android Dizinine Gidin**:
   ```powershell
   cd android
   ```

4. **SHA-1 Fingerprint Üretin**:
   ```powershell
   .\gradlew.bat signingReport
   ```

5. **Sonucu Bulun**:
   Çıktıda şu satırı arayın:
   ```
   Variant: debug
   Config: debug
   Store: C:\...\android\app\debug.keystore
   Alias: AndroidDebugKey
   SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
   ```

### Alternatif Yöntem (Keytool ile):

Eğer Gradle çalışmazsa, keytool kullanabilirsiniz:

```powershell
keytool -list -v -keystore android\app\debug.keystore -alias AndroidDebugKey -storepass android -keypass android
```

---

**Not:** SHA-1 fingerprint'i Firebase Console'da Android uygulamanıza eklemeniz gerekecek.

---

## Bundle ID Kontrolü

Android için Bundle ID: `com.tacticiq.app` ✅ (app.json ve build.gradle'da ayarlanmış)

iOS için Bundle ID: `com.tacticiq.app` ✅ (app.json'da ayarlanmış)
