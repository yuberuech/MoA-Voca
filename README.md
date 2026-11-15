# 모아보카 · 나만의 영어 단어장

GitHub Pages: https://yuberuech.github.io/MoA-Voca/

단어 등록, 플래시카드 암기, 한영·영한 시험, 철자 검사, 오답 복습 기능을 제공합니다.
기본 저장은 각 기기의 브라우저에 유지됩니다.

## 계정 기반 클라우드 동기화 (설정 전에는 비활성)

Firebase 대신 Supabase(PostgreSQL + 인증)를 사용합니다. 별도 프로젝트 연결 전에는 **기존 로컬 단어장으로 그대로 동작**합니다.

1. https://supabase.com 에서 프로젝트를 만듭니다.
2. Supabase Dashboard > SQL Editor에서 [supabase-setup.sql](supabase-setup.sql)을 실행합니다.
3. Supabase Dashboard > Project Settings > API 또는 Connect에서 **Project URL** 및 **publishable key** (또는 legacy anon key)를 확인합니다.
4. [sync-config.js](sync-config.js)의 `url`, `publishableKey`에 각각 입력해 커밋합니다. publishable/anon 키는 공개 클라이언트 키입니다. **service_role/secret 키나 데이터베이스 비밀번호는 절대 넣지 마세요.**
5. Supabase > Authentication > URL Configuration에서 Site URL을 `https://yuberuech.github.io/MoA-Voca/`로, Redirect URLs에도 이 주소를 등록합니다. Email 인증 제공자가 활성화되어 있어야 합니다.
6. GitHub Pages 배포가 완료되면 모아보카 설정 > 클라우드 동기화에서 같은 이메일로 로그인합니다. 받은 메일의 로그인 링크를 누릅니다.

두 기기의 기존 로컬 데이터가 서로 다르면 자동으로 덮어쓰지 않고 **서버 내용 가져오기** 또는 **이 기기 내용으로 서버 저장**을 직접 선택하게 합니다. 선택하기 전에 설정 > 백업에서 JSON 백업을 권장합니다. 동기화가 켜지면 로컬 저장과 클라우드 저장이 함께 수행되며, 다른 기기에서 다시 앱을 열면 서버 변경 내용을 가져옵니다.

보안: Supabase 데이터베이스는 Row Level Security를 사용하고 사용자는 자기 단어장 데이터만 읽거나 수정할 수 있습니다. GitHub Pages 자체에는 개인 학습 기록이 업로드되지 않습니다.

주의: Supabase 무료 프로젝트의 휴면 중지, 인증 이메일 발송 제한 및 인터넷 연결이 끊긴 경우 등에는 동기화가 지연될 수 있습니다. 중요 데이터는 정기적으로 JSON 백업하세요.
