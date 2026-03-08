# Hotel Manager - Sistema de Gestão

Um sistema completo de gestão hoteleira construído com **Node.js, Express, SQLite (sql.js)** e frontend nativo (Vanilla JS, HTML5, CSS3).

## 🗂️ Funcionalidades
- **Dashboard:** Visão geral de ocupação, receitas e atividades recentes.
- **Quartos:** Gerenciamento dos quartos (Grid View), com status integrado (Limpeza, Manutenção, Ocupado, Livre).
- **Hóspedes:** Cadastro completo de hóspedes, histórico e pesquisa.
- **Reservas:** Gestão de reservas com checagem automática de disponibilidade e datas.
- **Check-in/Check-out:** Fluxo dedicado para controlar entradas e saídas do dia local.
- **Serviços:** Catálogo de serviços extras, como refeições, massagens, etc., para lançar diretamente na conta da reserva.
- **Faturamento:** Extrato da reserva detalhado e pagamentos em várias modalidades.
- **Relatórios:** Gráficos da taxa de ocupação diária, extratos de faturamento mensais e perfil de hóspedes recorrentes.

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) v18+

### Passos

1. Clone este repositório:
```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd hotel-system
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm start
```

O servidor será inciado em `http://localhost:3000`. 
O banco de dados SQLite (`hotel.db.bin`) é inicializado de forma síncrona/em memória com a extensão WebAssembly (`sql.js`) garantindo zero estresse com compilações nativas C++. Ao inciar o sistema, ele rodará as "seeds" construindo uma estrutura modelo padrão de dados para fins de teste.

### Credenciais Padrão Admin
- **Usuário:** admin
- **Senha:** admin123

## 🛠️ Tecnologias Utilizadas
- **Backend:** Node.js, Express, sql.js, jsonwebtoken, bcryptjs, cors
- **Frontend:** HTML5, CSS3 e Javascript puro com animações fluidas e Chart.js
- **Arquitetura:** RESTful API com autenticação JWT. Banco de dados em arquivo local binário.
