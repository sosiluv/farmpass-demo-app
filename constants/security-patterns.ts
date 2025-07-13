/**
 * 🛡️ 보안 위협 패턴 상수
 *
 * 악성 봇, 스캐너, 해커 등이 자주 시도하는 패턴들을 정의합니다.
 * 실제 프로젝트에서 사용하지 않는 경로들만 차단합니다.
 */

// WordPress 관련 패턴
export const WORDPRESS_PATTERNS = [/\/wordpress/i, /\/wp-/i] as const;

// PHP 파일 패턴
export const PHP_PATTERNS = [/\.php$/i] as const;

// 시스템 디렉토리 패턴
export const SYSTEM_DIRECTORY_PATTERNS = [
  /\/config\//i,
  /\/backup\//i,
  /\/database\//i,
  /\/install\//i,
  /\/setup\//i,
] as const;

// AWS 관련 패턴
export const AWS_PATTERNS = [/\/\.aws\//i, /\/\.aws\/credentials/i] as const;

// 환경 변수 및 설정 파일 패턴
export const CONFIG_FILE_PATTERNS = [
  /\/\.env/i,
  /\/\.git/i,
  /\/\.ssh/i,
  /\/\.bash_history/i,
  /\/\.profile/i,
  /\/\.bashrc/i,
  /\/\.zshrc/i,
  /\/\.vimrc/i,
  /\/\.emacs/i,
  /\/\.config/i,
  /\/\.local/i,
] as const;

// 시스템 파일 패턴
export const SYSTEM_FILE_PATTERNS = [
  /\/\.cache/i,
  /\/\.tmp/i,
  /\/\.temp/i,
  /\/\.log/i,
  /\/\.pid/i,
  /\/\.lock/i,
  /\/\.swp/i,
  /\/\.swo/i,
  /\/\.bak/i,
  /\/\.old/i,
  /\/\.orig/i,
  /\/\.save/i,
  /\/\.copy/i,
] as const;

// 파일 확장자 패턴
export const FILE_EXTENSION_PATTERNS = [
  /\/\.tmp\./i,
  /\/\.temp\./i,
  /\/\.cache\./i,
  /\/\.log\./i,
  /\/\.pid\./i,
  /\/\.lock\./i,
  /\/\.swp\./i,
  /\/\.swo\./i,
  /\/\.bak\./i,
  /\/\.old\./i,
  /\/\.orig\./i,
  /\/\.save\./i,
  /\/\.copy\./i,
] as const;

// 데이터베이스 관련 패턴
export const DATABASE_PATTERNS = [
  /\/\.sql/i,
  /\/\.db/i,
  /\/\.sqlite/i,
  /\/\.sqlite3/i,
  /\/\.mysql/i,
  /\/\.postgresql/i,
  /\/\.mongo/i,
  /\/\.redis/i,
  /\/\.dump/i,
  /\/\.sql\./i,
  /\/\.db\./i,
  /\/\.sqlite\./i,
  /\/\.sqlite3\./i,
  /\/\.mysql\./i,
  /\/\.postgresql\./i,
  /\/\.mongo\./i,
  /\/\.redis\./i,
  /\/\.dump\./i,
] as const;

// 웹 서버 관련 패턴
export const WEB_SERVER_PATTERNS = [
  /\/\.htaccess/i,
  /\/\.htpasswd/i,
  /\/\.htaccess\./i,
  /\/\.htpasswd\./i,
  /\/\.nginx/i,
  /\/\.apache/i,
  /\/\.iis/i,
  /\/\.nginx\./i,
  /\/\.apache\./i,
  /\/\.iis\./i,
  /\/\.conf/i,
  /\/\.conf\./i,
  /\/\.ini/i,
  /\/\.ini\./i,
  /\/\.xml/i,
  /\/\.xml\./i,
  /\/\.yaml/i,
  /\/\.yml/i,
  /\/\.yaml\./i,
  /\/\.yml\./i,
  /\/\.toml/i,
  /\/\.toml\./i,
  /\/\.json/i,
  /\/\.json\./i,
] as const;

// 개발 도구 관련 패턴
export const DEVELOPMENT_PATTERNS = [
  /\/\.vscode/i,
  /\/\.idea/i,
  /\/\.eclipse/i,
  /\/\.netbeans/i,
  /\/\.sublime/i,
  /\/\.atom/i,
  /\/\.vscode\./i,
  /\/\.idea\./i,
  /\/\.eclipse\./i,
  /\/\.netbeans\./i,
  /\/\.sublime\./i,
  /\/\.atom\./i,
  /\/\.npmrc/i,
  /\/\.yarnrc/i,
  /\/\.composer/i,
  /\/\.npmrc\./i,
  /\/\.yarnrc\./i,
  /\/\.composer\./i,
  /\/\.bowerrc/i,
  /\/\.bowerrc\./i,
  /\/\.jshintrc/i,
  /\/\.eslintrc/i,
  /\/\.jshintrc\./i,
  /\/\.eslintrc\./i,
] as const;

// 클라우드 서비스 관련 패턴
export const CLOUD_SERVICE_PATTERNS = [
  /\/\.aws/i,
  /\/\.azure/i,
  /\/\.gcp/i,
  /\/\.google/i,
  /\/\.cloudflare/i,
  /\/\.heroku/i,
  /\/\.vercel/i,
  /\/\.netlify/i,
  /\/\.aws\./i,
  /\/\.azure\./i,
  /\/\.gcp\./i,
  /\/\.google\./i,
  /\/\.cloudflare\./i,
  /\/\.heroku\./i,
  /\/\.vercel\./i,
  /\/\.netlify\./i,
  /\/\.docker/i,
  /\/\.docker\./i,
  /\/\.k8s/i,
  /\/\.kubernetes/i,
  /\/\.k8s\./i,
  /\/\.kubernetes\./i,
] as const;

// 보안 관련 패턴
export const SECURITY_PATTERNS = [
  /\/\.key/i,
  /\/\.pem/i,
  /\/\.crt/i,
  /\/\.cert/i,
  /\/\.p12/i,
  /\/\.pfx/i,
  /\/\.key\./i,
  /\/\.pem\./i,
  /\/\.crt\./i,
  /\/\.cert\./i,
  /\/\.p12\./i,
  /\/\.pfx\./i,
  /\/\.jwt/i,
  /\/\.token/i,
  /\/\.secret/i,
  /\/\.password/i,
  /\/\.jwt\./i,
  /\/\.token\./i,
  /\/\.secret\./i,
  /\/\.password\./i,
] as const;

// 백업 및 압축 파일 패턴
export const BACKUP_PATTERNS = [
  /\/\.tar/i,
  /\/\.gz/i,
  /\/\.zip/i,
  /\/\.rar/i,
  /\/\.7z/i,
  /\/\.bz2/i,
  /\/\.xz/i,
  /\/\.tar\./i,
  /\/\.gz\./i,
  /\/\.zip\./i,
  /\/\.rar\./i,
  /\/\.7z\./i,
  /\/\.bz2\./i,
  /\/\.xz\./i,
  /\/\.backup/i,
  /\/\.backup\./i,
  /\/\.archive/i,
  /\/\.archive\./i,
] as const;

// 모든 악성 패턴을 하나의 배열로 결합
export const MALICIOUS_PATTERNS = [
  ...WORDPRESS_PATTERNS,
  ...PHP_PATTERNS,
  ...SYSTEM_DIRECTORY_PATTERNS,
  ...AWS_PATTERNS,
  ...CONFIG_FILE_PATTERNS,
  ...SYSTEM_FILE_PATTERNS,
  ...FILE_EXTENSION_PATTERNS,
  ...DATABASE_PATTERNS,
  ...WEB_SERVER_PATTERNS,
  ...DEVELOPMENT_PATTERNS,
  ...CLOUD_SERVICE_PATTERNS,
  ...SECURITY_PATTERNS,
  ...BACKUP_PATTERNS,
] as const;
