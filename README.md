# VW Layout Editor

Editor de layouts personalizado para etiquetas de chão de fábrica da Volkswagen.

## Características

- Editor de layout drag-and-drop intuitivo
- Possibilidade de adicionar diferentes tipos de elementos (texto, imagem, variáveis, dropdown)
- Personalização completa de elementos (posição, tamanho, estilo)
- Integração com dados dinâmicos via API
- Salvamento e carregamento de layouts

## Tecnologias Utilizadas

- React
- TypeScript
- Tailwind CSS
- DND Kit (para funcionalidade drag-and-drop)
- Zustand (gerenciamento de estado)
- Axios (chamadas de API)

## Pré-requisitos

- Node.js (v14 ou superior)
- npm ou yarn

## Instalação

1. Clone o repositório:
   ```sh
   git clone https://github.com/seu-usuario/layout-editor-volkswagen.git
   cd layout-editor-volkswagen
   ```
2. Instale as dependências:
   ```sh
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```sh
   npm run dev
   ```
   O aplicativo estará disponível em `http://localhost:5173`.

## Como Usar

### Criação de Layout

1. No painel esquerdo, dê um nome ao seu layout e defina as dimensões.
2. Clique em "Criar Novo Layout".

### Adição de Elementos

1. No painel de ferramentas, clique em um dos tipos de elementos disponíveis:
   - Texto
   - Imagem
   - Variável
   - Dropdown
2. O elemento será adicionado ao canvas e poderá ser movido, redimensionado e personalizado.

### Personalização de Elementos

1. Selecione um elemento no canvas.
2. Use o painel direito para editar suas propriedades:
   - Conteúdo
   - Posição e tamanho
   - Propriedades de estilo (fonte, cores, bordas, etc.)
   - Variáveis (para elementos de tipo variável ou dropdown)

### Salvamento e Carregamento

1. Para salvar seu layout atual, clique em "Salvar Layout" no painel esquerdo.
2. Para carregar um layout salvo anteriormente, selecione-o na lista de layouts salvos.

## Fluxo de Integração com Dados Dinâmicos

1. Adicione um elemento de variável ou dropdown ao canvas.
2. Selecione a chave da variável no painel de propriedades.
3. O elemento será atualizado automaticamente com os dados correspondentes da API.
4. Se a variável contiver uma URL de imagem, ela será exibida como uma imagem.

## Estrutura do Projeto

```
src/
├── components/
│   ├── layout/  # Componentes principais do editor
│   └── ui/      # Componentes de interface reutilizáveis
├── hooks/       # Hooks personalizados
├── services/    # Serviços de API
├── store/       # Gerenciamento de estado com Zustand
├── types/       # Definições de tipos TypeScript
├── App.tsx      # Componente principal
└── main.tsx     # Ponto de entrada
```

