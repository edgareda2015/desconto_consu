# 🏛️ Desconto Consu: Design System (v1.0)

Este documento define os padrões de interface e experiência do usuário para o sistema **Desconto Consu - Unidade Olinda**. O foco é um design corporativo premium, estável e altamente profissional.

---

## 1. Fundações (Design Tokens)

### 🎨 Cores (Corporate Palette)
*   `--primary`: `#1E293B` (Deep Navy) - Branding e Headers
*   `--action`: `#2563EB` (Corporate Blue) - Links e Botões
*   `--action-hover`: `#1D4ED8`
*   `--bg-main`: `#F8FAFC` (Slate 50) - Fundo da App
*   `--surface`: `#FFFFFF` - Cards e Inputs
*   `--border`: `#E2E8F0` (Slate 200) - Divisores e Bordas
*   `--text-main`: `#334155` (Slate 700) - Corpo de texto
*   `--text-muted`: `#64748B` (Slate 500) - Labels e legendas
*   `--success`: `#059669` (Emerald 600)
*   `--error`: `#DC2626` (Red 600)
*   `--warning`: `#D97706` (Amber 600)

### ✍️ Tipografia
*   **Font Family:** `Inter, system-ui, sans-serif`
*   **H1:** 28px / 700 (Bold)
*   **H2:** 20px / 600 (Semibold)
*   **Body:** 14px / 400 (Regular)
*   **Small:** 12px / 500 (Medium)

### 📏 Espaçamento e Bordas
*   **Unit Base:** 8px
*   **Border Radius:** 12px (Premium Roundness)
*   **Shadow:** `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`

---

## 2. Componentes

### Botões
*   **Primary:** Preenchimento sólido `--action`, texto branco.
*   **Secondary:** Borda `--border`, fundo branco, texto `--primary`.
*   **Ajustes:** Altura mínima 44px para toque/clique confortável.

### Cards
*   Fundo branco, borda sutil, cantos arredondados (12px).
*   Padding padrão: 24px.

### Tabelas
*   Header com fundo levemente acinzentado (`#F1F5F9`).
*   Linhas com hover suave.
*   Status representados por "Badges" coloridos (fundo claro + texto escuro).

---

## 3. Regras de Ouro
1.  **Consistência:** Um componente deve se comportar e parecer igual em todas as telas.
2.  **Feedback Visual:** Todo clique ou ação deve ter um estado visual (loading/toast).
3.  **Hierarquia:** Informações mais importantes devem ter mais peso visual (negrito ou cor primária).
4.  **Acessibilidade:** Contraste de texto sempre verificado (WCAG AA).
