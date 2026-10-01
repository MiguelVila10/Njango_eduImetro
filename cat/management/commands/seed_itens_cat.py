# cat/management/commands/seed_itens_cat.py
"""
Povoa o banco de itens do CAT (RF04, RF05).

BANCO PROVISÓRIO: estas perguntas servem para desenvolver e testar o CAT
adaptativo. Serão substituídas pelo banco final validado por pedagogo
(5 perguntas por tendência).

O comando é idempotente e NÃO apaga perguntas: cria as que faltam e
actualiza as existentes (identificadas pelo texto). Perguntas cadastradas
pelo orientador no Admin e respostas dos alunos são preservadas.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from cat.models import ItemCAT


def opcoes(analitico, humanista, criativo, estrategista):
    return [
        {"texto": analitico, "arquetipo": "Analítico"},
        {"texto": humanista, "arquetipo": "Humanista"},
        {"texto": criativo, "arquetipo": "Criativo"},
        {"texto": estrategista, "arquetipo": "Estrategista"},
    ]


ITENS_CAT = [
    {"texto": "Num trabalho de grupo, qual destas tarefas preferes assumir?", "opcoes": opcoes("Organizar os dados e verificar se os números e os cálculos estão correctos", "Garantir que todos na equipa se sentem ouvidos e incluídos", "Desenhar a apresentação e tornar o trabalho visualmente atractivo", "Definir o plano, os prazos e coordenar quem faz o quê"), "tendencia": "neutra"},
    {"texto": "Quando surge um problema difícil, qual é a tua primeira reacção?", "opcoes": opcoes("Tentar perceber a causa exacta do problema, passo a passo", "Pensar em como o problema pode estar a afectar outras pessoas", "Procurar uma solução diferente do habitual, fora do comum", "Avaliar as opções disponíveis e escolher a mais vantajosa a longo prazo"), "tendencia": "Analítico"},
    {"texto": "Nos tempos livres, qual destas actividades escolherias?", "opcoes": opcoes("Resolver um puzzle lógico ou um jogo de estratégia numérica", "Conversar com amigos sobre os seus problemas e experiências", "Desenhar, escrever ou criar algo original", "Planear uma viagem ou organizar um evento com os amigos"), "tendencia": "neutra"},
    {"texto": "Se pudesses escolher uma disciplina extra na escola, qual seria?", "opcoes": opcoes("Uma disciplina de cálculo avançado ou programação", "Uma disciplina sobre relações humanas ou voluntariado", "Uma disciplina de artes plásticas ou música", "Uma disciplina de gestão, economia ou liderança"), "tendencia": "neutra"},
    {"texto": "Como preferes aprender uma matéria nova?", "opcoes": opcoes("Através de fórmulas, esquemas e exercícios práticos", "Através de discussões em grupo e exemplos do dia-a-dia", "Através de vídeos, imagens ou actividades criativas", "Através de um plano de estudo bem organizado, com objectivos claros"), "tendencia": "Criativo"},
    {"texto": "Numa competição desportiva, o que mais te motiva?", "opcoes": opcoes("Analisar as estatísticas e a técnica da equipa adversária", "O espírito de equipa e o apoio mútuo entre colegas", "A originalidade das jogadas e a expressão pessoal em campo", "A estratégia do jogo e a possibilidade de conquistar o título"), "tendencia": "neutra"},
    {"texto": "Qual destas profissões te desperta mais curiosidade?", "opcoes": opcoes("Engenheiro ou cientista de dados", "Enfermeiro ou psicólogo", "Designer ou artista plástico", "Gestor de projectos ou empresário"), "tendencia": "neutra"},
    {"texto": "Quando lês uma notícia importante, o que mais te interessa saber?", "opcoes": opcoes("Os números e os factos concretos por detrás da notícia", "Como essa notícia afecta a vida das pessoas envolvidas", "Como essa notícia poderia ser contada de forma diferente e mais interessante", "Quais as consequências futuras e o que pode ser feito a respeito"), "tendencia": "neutra"},
    {"texto": "Se tivesses de organizar uma festa de turma, qual seria o teu papel preferido?", "opcoes": opcoes("Calcular o orçamento e garantir que as contas fecham certo", "Certificar-te de que ninguém fica de fora e todos se divertem", "Escolher a decoração e criar um ambiente diferente", "Definir o horário, os convidados e o plano geral do evento"), "tendencia": "Humanista"},
    {"texto": "Qual destas frases descreve melhor a forma como tomas decisões?", "opcoes": opcoes("Analiso os prós e os contras com base em dados concretos", "Penso em como a decisão vai afectar as pessoas à minha volta", "Sigo aquilo que sinto ser mais autêntico e original", "Penso no objectivo final e no melhor caminho para lá chegar"), "tendencia": "neutra"},
    {"texto": "Numa visita de estudo, o que mais gostarias de explorar?", "opcoes": opcoes("Um laboratório de ciências ou um centro de investigação", "Um hospital, uma instituição social ou uma comunidade", "Um museu de arte ou um estúdio criativo", "Uma empresa ou uma instituição pública em funcionamento"), "tendencia": "neutra"},
    {"texto": "Se pudesses resolver um problema do mundo, qual escolherias?", "opcoes": opcoes("Desenvolver uma tecnologia que resolva um problema técnico complexo", "Reduzir a desigualdade social e apoiar quem mais precisa", "Inspirar as pessoas através da arte ou da cultura", "Melhorar a forma como os recursos são geridos e distribuídos"), "tendencia": "neutra"},
    {"texto": "Como reages quando um plano não corre como esperado?", "opcoes": opcoes("Reviso os dados e tento perceber exactamente onde falhou", "Verifico como as pessoas envolvidas estão a lidar com a situação", "Procuro uma alternativa criativa que ninguém tinha pensado antes", "Ajusto o plano rapidamente e defino os próximos passos"), "tendencia": "Estrategista"},
    {"texto": "Qual destes tipos de livro ou filme preferes?", "opcoes": opcoes("Ficção científica ou histórias com enigmas para resolver", "Dramas sobre relações humanas e superação pessoal", "Histórias com um estilo visual ou narrativo pouco comum", "Biografias de líderes ou histórias de conquista e planeamento"), "tendencia": "neutra"},
    {"texto": "Num debate na sala de aula, que papel assumes mais naturalmente?", "opcoes": opcoes("Apresentar dados e argumentos bem fundamentados", "Garantir que todas as opiniões são respeitadas", "Trazer uma perspectiva diferente e pouco explorada", "Moderar a discussão e orientar o grupo para uma conclusão"), "tendencia": "Humanista"},
    {"texto": "O que mais valorizas ao escolher um curso técnico?", "opcoes": opcoes("A possibilidade de trabalhar com cálculos, sistemas ou tecnologia", "A possibilidade de ajudar directamente outras pessoas", "A possibilidade de expressar ideias e criar algo novo", "A possibilidade de gerir projectos ou liderar equipas no futuro"), "tendencia": "neutra"},
    {"texto": "Qual destas actividades escolares te dá mais satisfação ao terminar?", "opcoes": opcoes("Resolver um exercício de matemática ou física até ao fim", "Ajudar um colega a compreender uma matéria difícil", "Terminar um desenho, um texto ou um projecto criativo", "Concluir um plano ou uma apresentação bem organizada"), "tendencia": "Humanista"},
    {"texto": "Se tivesses de escolher um clube extracurricular, qual seria?", "opcoes": opcoes("Clube de robótica, matemática ou ciências", "Clube de voluntariado ou apoio social", "Clube de teatro, música ou artes visuais", "Clube de debate, liderança ou empreendedorismo"), "tendencia": "neutra"},
    {"texto": "O que mais admiras numa pessoa que consideras bem-sucedida?", "opcoes": opcoes("A capacidade de resolver problemas complexos com lógica", "A capacidade de se relacionar bem e ajudar os outros", "A capacidade de criar algo único e inspirador", "A capacidade de planear e alcançar grandes objectivos"), "tendencia": "Humanista"},
    {"texto": "Numa tarde livre sem compromissos, o que provavelmente farias?", "opcoes": opcoes("Investigar um tema técnico que despertou a tua curiosidade", "Passar tempo com família ou amigos, a conversar", "Dedicar-te a um projecto criativo pessoal", "Planear os teus próximos objectivos ou organizar as tuas tarefas"), "tendencia": "neutra"},
    {"texto": "Duas pessoas do teu grupo estão chateadas uma com a outra. O que farias para resolver a situação?", "opcoes": opcoes("Analisaria o que levou à discussão e tentaria perceber a lógica do conflito", "Conversaria com os dois para que se entendam e façam as pazes", "Criaria um desenho ou uma mensagem criativa para os ajudar a fazer as pazes", "Geriria a situação para que o conflito não prejudique o trabalho do grupo"), "tendencia": "Humanista"},
]


class Command(BaseCommand):
    help = "Povoa/actualiza o banco provisório de itens do CAT sem apagar perguntas existentes."

    @transaction.atomic
    def handle(self, *args, **options):
        criados, actualizados = 0, 0
        for item in ITENS_CAT:
            _, criado = ItemCAT.objects.update_or_create(
                texto=item["texto"],
                defaults={
                    "tipo": "nucleo",
                    "tendencia": item["tendencia"],
                    "opcoes": item["opcoes"],
                },
            )
            if criado:
                criados += 1
            else:
                actualizados += 1
        self.stdout.write(self.style.SUCCESS(
            f"Banco CAT: {criados} perguntas criadas, {actualizados} actualizadas. "
            f"Total na base de dados: {ItemCAT.objects.count()}."
        ))
