# cursos/management/commands/seed_cursos.py

from django.core.management.base import BaseCommand
from django.db import transaction

from cursos.models import Curso, PreRequisitoCurso, VetorIdealCurso


# Ordem do vetor_ideal:
# [Port, Mat, Fís, Quím, Bio, Hist, Geo, L.Estrangeira, EMC, Ed.Fís, Ed.Visual, Ed.Laboral]
ORDEM_DISCIPLINAS = [
    "Português", "Matemática", "Física", "Química", "Biologia",
    "História", "Geografia", "Língua Estrangeira", "Educação Moral e Cívica",
    "Educação Física", "Educação Visual", "Educação Laboral",
]

MAPA_REQUISITOS = {
    "matematica": "Matemática", "fisica": "Física", "quimica": "Química",
    "biologia": "Biologia", "lingua_portuguesa": "Português",
    "historia": "História", "ed_visual": "Educação Visual",
    "ed_laboral": "Educação Laboral", "educacao_fisica": "Educação Física",
}

ARQUETIPO_POR_INSTITUICAO = {
    "ITEL": "Analítico", "IPIL": "Analítico",
    "IMEL": "Estrategista", "IMS": "Humanista", "CEARTE": "Criativo",
}

# Pré-requisitos extra que não seguem o padrão "requisitos" simples
# (disciplina, nota_min) adicionados manualmente por curso, por chave
REQUISITOS_EXTRA = {
    "imel_comunicacao": [("Educação Moral e Cívica", 14)],
    "cearte_musica": [("Educação Moral e Cívica", 13)],
}

CURSOS_DISPONIVEIS = {
    "itel_informatica": {"nome": "Técnico de Informática (ITEL)", "vetor_ideal": [14, 19, 17, 14, 13, 12, 12, 15, 14, 14, 13, 17], "requisitos": {"matematica": 14, "fisica": 14}},
    "itel_eletronica": {"nome": "Técnico de Electrónica e Telecomunicações (ITEL)", "vetor_ideal": [13, 18, 18, 15, 12, 12, 12, 14, 14, 14, 13, 16], "requisitos": {"matematica": 14, "quimica": 14, "fisica": 14}},
    "itel_multimedia": {"nome": "Técnico de Informática e Sistemas Multimédia (ITEL)", "vetor_ideal": [15, 17, 15, 13, 13, 13, 13, 16, 14, 14, 17, 16], "requisitos": {"matematica": 14, "fisica": 14, "ed_visual": 14}},
    "ipil_quimica": {"nome": "Técnico de Química Industrial (IPIL)", "vetor_ideal": [14, 17, 16, 19, 15, 12, 12, 14, 14, 14, 12, 16], "requisitos": {"quimica": 14, "matematica": 14, "fisica": 14}},
    "ipil_construcao": {"nome": "Técnico de Construção Civil (IPIL)", "vetor_ideal": [13, 18, 17, 14, 12, 12, 13, 13, 14, 15, 17, 18], "requisitos": {"matematica": 14, "fisica": 14, "ed_visual": 14}},
    "ipil_energia": {"nome": "Técnico de Energia e Instalações Eléctricas (IPIL)", "vetor_ideal": [13, 18, 18, 14, 12, 12, 12, 13, 14, 15, 13, 17], "requisitos": {"matematica": 14, "fisica": 14}},
    "ipil_automacao": {"nome": "Técnico de Electrónica e Automação (IPIL)", "vetor_ideal": [13, 19, 18, 14, 12, 12, 12, 14, 14, 14, 13, 17], "requisitos": {"matematica": 14, "fisica": 14}},
    "ipil_mecanica": {"nome": "Técnico de Mecânica (Máquinas e Motores) (IPIL)", "vetor_ideal": [13, 18, 18, 14, 12, 12, 12, 13, 14, 15, 16, 18], "requisitos": {"matematica": 14, "fisica": 14, "ed_laboral": 14}},
    "imel_contabilidade": {"nome": "Técnico de Contabilidade e Gestão (IMEL)", "vetor_ideal": [17, 18, 13, 13, 12, 14, 14, 15, 14, 14, 12, 14], "requisitos": {"matematica": 14, "lingua_portuguesa": 14}},
    "imel_financas": {"nome": "Técnico de Finanças (IMEL)", "vetor_ideal": [16, 18, 13, 13, 12, 14, 14, 15, 14, 14, 12, 14], "requisitos": {"matematica": 14, "lingua_portuguesa": 14}},
    "imel_gestao": {"nome": "Técnico de Gestão Empresarial (IMEL)", "vetor_ideal": [16, 16, 12, 12, 12, 14, 14, 15, 14, 14, 12, 13], "requisitos": {"lingua_portuguesa": 13, "matematica": 13}},
    "imel_info_gestao": {"nome": "Técnico de Informática de Gestão (IMEL)", "vetor_ideal": [16, 18, 15, 13, 12, 13, 13, 15, 14, 14, 13, 15], "requisitos": {"matematica": 14, "lingua_portuguesa": 14}},
    "imel_comunicacao": {"nome": "Técnico de Comunicação Social (IMEL)", "vetor_ideal": [19, 14, 12, 12, 12, 16, 15, 16, 16, 14, 14, 13], "requisitos": {"lingua_portuguesa": 14, "historia": 14}},
    "ims_farmacia": {"nome": "Técnico de Farmácia (IMS)", "vetor_ideal": [16, 15, 15, 18, 18, 12, 12, 14, 14, 14, 12, 14], "requisitos": {"quimica": 14, "biologia": 14, "lingua_portuguesa": 14}},
    "ims_radiologia": {"nome": "Técnico de Radiologia (IMS)", "vetor_ideal": [15, 16, 17, 15, 18, 12, 12, 14, 14, 14, 12, 14], "requisitos": {"matematica": 14, "fisica": 14, "biologia": 14}},
    "ims_fisioterapia": {"nome": "Técnico de Fisioterapia (IMS)", "vetor_ideal": [15, 15, 16, 14, 19, 12, 12, 14, 14, 15, 12, 14], "requisitos": {"biologia": 14, "fisica": 14, "educacao_fisica": 14}},
    "ims_saude_ambiental": {"nome": "Técnico de Saúde Ambiental (IMS)", "vetor_ideal": [15, 15, 14, 17, 18, 13, 13, 14, 14, 14, 12, 14], "requisitos": {"biologia": 14, "quimica": 14}},
    "cearte_artes": {"nome": "Técnico de Artes Visuais e Plásticas (CEARTE)", "vetor_ideal": [15, 13, 12, 12, 12, 14, 13, 14, 14, 14, 19, 15], "requisitos": {"ed_visual": 15, "lingua_portuguesa": 14}},
    "cearte_musica": {"nome": "Técnico de Música (CEARTE)", "vetor_ideal": [15, 13, 12, 12, 12, 14, 13, 15, 14, 14, 13, 14], "requisitos": {"lingua_portuguesa": 14, "historia": 14, "ed_moral_civica": 14}},
    "cearte_teatro": {"nome": "Técnico de Teatro e Cinema (CEARTE)", "vetor_ideal": [18, 13, 12, 12, 12, 16, 14, 15, 16, 14, 14, 14], "requisitos": {"lingua_portuguesa": 14, "historia": 15}},
}


class Command(BaseCommand):
    help = "Povoa a base de conhecimento com os 20 cursos técnicos de Luanda (Curso, PreRequisitoCurso, VetorIdealCurso)."

    @transaction.atomic
    def handle(self, *args, **options):
        Curso.objects.all().delete()  # idempotente — corre quantas vezes quiseres, sem duplicar

        for chave, dados in CURSOS_DISPONIVEIS.items():
            instituicao = dados["nome"].split("(")[-1].rstrip(")")
            arquetipo = ARQUETIPO_POR_INSTITUICAO[instituicao]

            curso = Curso.objects.create(
                nome=dados["nome"].split(" (")[0],
                instituicao=instituicao,
                arquetipo_dominante=arquetipo,
            )

            for chave_req, nota_min in dados["requisitos"].items():
                disciplina = MAPA_REQUISITOS[chave_req]
                PreRequisitoCurso.objects.create(curso=curso, disciplina=disciplina, nota_min=nota_min)

            for disciplina, nota_min in REQUISITOS_EXTRA.get(chave, []):
                PreRequisitoCurso.objects.create(curso=curso, disciplina=disciplina, nota_min=nota_min)

            for disciplina, peso in zip(ORDEM_DISCIPLINAS, dados["vetor_ideal"]):
                VetorIdealCurso.objects.create(curso=curso, disciplina=disciplina, peso_ideal=peso)

            self.stdout.write(self.style.SUCCESS(f"Criado: {curso.nome} ({curso.instituicao})"))

        self.stdout.write(self.style.SUCCESS(f"\n{Curso.objects.count()} cursos criados com sucesso."))