# cursos/descricoes.py
"""
Explicação curta de cada curso para o aluno (o que se aprende), em linguagem
simples. Usada pelo seed_cursos e pela migração 0003 para preencher o campo
Curso.descricao quando ainda está vazio (nunca substitui um texto editado
pelo orientador no Admin).
"""

DESCRICOES = {
    ("Técnico de Informática", "ITEL"):
        "Aprendes como funcionam os computadores e os programas, a montar e reparar equipamentos e a criar soluções com tecnologia.",
    ("Técnico de Electrónica e Telecomunicações", "ITEL"):
        "Aprendes como funcionam os aparelhos electrónicos e as redes que levam voz, dados e internet: antenas, cabos, telemóveis e satélites.",
    ("Técnico de Informática e Sistemas Multimédia", "ITEL"):
        "Aprendes a programar e a criar conteúdos digitais, como sites, vídeo, som e imagem.",
    ("Técnico de Química Industrial", "IPIL"):
        "Aprendes como se transformam matérias-primas em produtos, como combustíveis, tintas e alimentos, e a controlar a sua qualidade em laboratório.",
    ("Técnico de Construção Civil", "IPIL"):
        "Aprendes a ler e desenhar plantas, a calcular materiais e a acompanhar a construção de casas, estradas e outras obras.",
    ("Técnico de Energia e Instalações Eléctricas", "IPIL"):
        "Aprendes a fazer e a manter instalações eléctricas em casas e empresas, e como se produz e distribui a energia.",
    ("Técnico de Electrónica e Automação", "IPIL"):
        "Aprendes como funcionam os circuitos electrónicos e a montar e programar sistemas que trabalham sozinhos, como máquinas com sensores.",
    ("Técnico de Mecânica", "IPIL"):
        "Aprendes como funcionam os motores e as máquinas e a montá-los, repará-los e mantê-los a trabalhar.",
    ("Técnico de Contabilidade e Gestão", "IMEL"):
        "Aprendes a registar e organizar as contas de uma empresa, a calcular custos e lucros e a apoiar a sua gestão.",
    ("Técnico de Finanças", "IMEL"):
        "Aprendes a gerir dinheiro, impostos, contas bancárias e investimentos, e a analisar a saúde financeira de empresas e instituições.",
    ("Técnico de Gestão Empresarial", "IMEL"):
        "Aprendes a organizar e dirigir uma empresa: planear, gerir pessoas, vendas e recursos.",
    ("Técnico de Informática de Gestão", "IMEL"):
        "Aprendes a usar a informática para apoiar as empresas: bases de dados, programas de gestão e organização da informação.",
    ("Técnico de Comunicação Social", "IMEL"):
        "Aprendes a escrever notícias, a fazer entrevistas e a preparar conteúdos para rádio, televisão, jornais e internet.",
    ("Técnico de Farmácia", "IMS"):
        "Aprendes sobre medicamentos: como se preparam, guardam e entregam, e como orientar as pessoas para os usarem bem.",
    ("Técnico de Radiologia", "IMS"):
        "Aprendes a fazer exames de imagem, como o raio-X, que ajudam os médicos a ver o interior do corpo.",
    ("Técnico de Fisioterapia", "IMS"):
        "Aprendes a ajudar pessoas a recuperar os movimentos depois de lesões ou doenças, com exercícios e técnicas de reabilitação.",
    ("Técnico de Saúde Ambiental", "IMS"):
        "Aprendes a proteger a saúde das pessoas cuidando do ambiente: água, saneamento, lixo e prevenção de doenças.",
    ("Técnico de Artes Visuais e Plásticas", "CEARTE"):
        "Aprendes desenho, pintura, escultura e outras artes visuais, e a usar a criatividade em obras e projectos gráficos.",
    ("Técnico de Música", "CEARTE"):
        "Aprendes teoria musical, a tocar instrumentos e a cantar, e a preparar e apresentar espectáculos.",
    ("Técnico de Teatro e Cinema", "CEARTE"):
        "Aprendes representação, voz e movimento, e como se prepara uma peça de teatro ou um filme, do guião à cena.",
}
