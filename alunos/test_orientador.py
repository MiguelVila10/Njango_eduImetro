# alunos/test_orientador.py — o que o orientador vê (lista, ficha, painel, contagens)

from rest_framework import status
from rest_framework.test import APITestCase

from cat.models import ItemCAT, RespostaCAT
from cursos.models import Curso
from recomendacoes.models import Recomendacao
from .apoio_testes import autenticar_aluno, autenticar_orientador
from .models import Aluno, NotaDisciplina

OPCOES = [
    {"texto": "a", "arquetipo": "Analítico"}, {"texto": "b", "arquetipo": "Humanista"},
    {"texto": "c", "arquetipo": "Criativo"}, {"texto": "d", "arquetipo": "Estrategista"},
]


class VistaDoOrientadorTest(APITestCase):

    def setUp(self):
        self.curso = Curso.objects.create(nome="Informática", instituicao="ITEL", arquetipo_dominante="Analítico")
        self.outro_curso = Curso.objects.create(nome="Artes", instituicao="CEARTE", arquetipo_dominante="Criativo")
        self.item = ItemCAT.objects.create(texto="P1", tipo="nucleo", opcoes=OPCOES)
        self.item2 = ItemCAT.objects.create(texto="P2", tipo="nucleo", opcoes=OPCOES)

        # Ana: concluído, escolheu Informática.
        self.ana = Aluno.objects.create(nome="Ana", idade=15, escola="X")
        self._rec(self.ana, self.curso, 1, escolhida=True)
        self._rec(self.ana, self.outro_curso, 2)
        for item in (self.item, self.item2):
            RespostaCAT.objects.create(aluno=self.ana, item=item, arquetipo_escolhido="Analítico")
        NotaDisciplina.objects.create(aluno=self.ana, disciplina="Matemática", nota=17)

        # Bento: confiança baixa → ponto de atenção, ainda não decidiu.
        self.bento = Aluno.objects.create(nome="Bento", idade=15, escola="X")
        self._rec(self.bento, self.outro_curso, 1,
                  confianca={"nivel": "baixa", "motivos": ["Respostas muito rápidas."]})
        RespostaCAT.objects.create(aluno=self.bento, item=self.item, arquetipo_escolhido="Criativo")

        # Carla: começou mas não terminou.
        self.carla = Aluno.objects.create(nome="Carla", idade=14, escola="Y")

        autenticar_orientador(self.client)

    def _rec(self, aluno, curso, rank, escolhida=False, confianca=None, alertas=None):
        return Recomendacao.objects.create(
            aluno=aluno, curso=curso, score_academico=0.8, score_psicografico=0.5, score_final=0.68,
            rank=rank, escolhida_pelo_aluno=escolhida, confianca_cat=confianca or {"nivel": "normal"},
            alertas_vieses=alertas or {"sobrestimacao": [], "subestimacao": []},
        )

    def test_lista_mostra_estado_perfil_sugestao_e_escolha(self):
        dados = {a["nome"]: a for a in self.client.get("/api/alunos/").data}

        self.assertEqual(dados["Ana"]["estado"], "concluido")
        self.assertEqual(dados["Ana"]["perfil_dominante"], "Analítico")
        self.assertEqual(dados["Ana"]["primeira_sugestao"]["nome"], "Informática")
        self.assertEqual(dados["Ana"]["curso_escolhido"]["nome"], "Informática")
        self.assertIn("criado_em", dados["Ana"])

        self.assertEqual(dados["Bento"]["estado"], "ponto_de_atencao")
        self.assertEqual(dados["Bento"]["confianca"], "baixa")
        self.assertIsNone(dados["Bento"]["curso_escolhido"])  # ainda não decidiu

        self.assertEqual(dados["Carla"]["estado"], "por_terminar")
        self.assertIsNone(dados["Carla"]["perfil_dominante"])

    def test_alerta_de_vies_tambem_e_ponto_de_atencao(self):
        Recomendacao.objects.filter(aluno=self.ana, rank=1).update(
            alertas_vieses={"sobrestimacao": ["Analítico"], "subestimacao": []})
        dados = {a["nome"]: a for a in self.client.get("/api/alunos/").data}
        self.assertEqual(dados["Ana"]["estado"], "ponto_de_atencao")

    def test_ficha_do_aluno_traz_notas_sugestoes_e_motivos(self):
        dados = self.client.get(f"/api/alunos/{self.bento.id}/").data
        self.assertEqual(dados["motivos_confianca"], ["Respostas muito rápidas."])
        self.assertEqual(dados["sugestoes"][0]["nome"], "Artes")

        dados = self.client.get(f"/api/alunos/{self.ana.id}/").data
        self.assertEqual(dados["notas"], {"Matemática": 17})
        self.assertEqual([s["rank"] for s in dados["sugestoes"]], [1, 2])

    def test_aluno_continua_a_ver_so_o_registo_basico(self):
        self.client.logout()
        autenticar_aluno(self.client, self.ana)
        dados = self.client.get(f"/api/alunos/{self.ana.id}/").data
        self.assertEqual(set(dados), {"id", "nome", "idade", "escola"})

    def test_painel_mostra_perfis_e_testes_por_terminar(self):
        dados = self.client.get("/api/painel/resumo/").data
        self.assertEqual(dados["testes_por_terminar"], 1)
        self.assertEqual(dados["distribuicao_perfis"],
                         {"Analítico": 1, "Humanista": 0, "Criativo": 1, "Estrategista": 0})

    def test_contagens_dos_cursos_so_para_o_orientador(self):
        cursos = {c["nome"]: c for c in self.client.get("/api/cursos/").data}
        self.assertEqual(cursos["Artes"]["vezes_sugerido"], 2)
        self.assertEqual(cursos["Artes"]["vezes_primeiro"], 1)
        self.assertEqual(cursos["Informática"]["vezes_escolhido"], 1)

        self.client.logout()
        publico = {c["nome"]: c for c in self.client.get("/api/cursos/").data}
        self.assertNotIn("vezes_sugerido", publico["Artes"])
        self.assertIn("descricao", publico["Artes"])

    def test_contagem_de_respostas_por_pergunta(self):
        item = self.client.get(f"/api/itens-cat/{self.item.id}/").data
        self.assertEqual(item["total_respostas"], 2)
        self.assertEqual(item["respostas_por_arquetipo"]["Analítico"], 1)
        self.assertEqual(item["respostas_por_arquetipo"]["Criativo"], 1)

    def test_descricao_do_curso_e_gravada(self):
        resposta = self.client.patch(f"/api/cursos/{self.curso.id}/",
                                     {"descricao": "Redes, programação e manutenção."}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.curso.refresh_from_db()
        self.assertEqual(self.curso.descricao, "Redes, programação e manutenção.")
