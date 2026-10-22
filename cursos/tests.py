from alunos.apoio_testes import autenticar_orientador
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from rest_framework.test import APITestCase
from rest_framework import status

from .models import Curso, PreRequisitoCurso, VetorIdealCurso


class CursoModelTest(TestCase):
    def test_criar_curso_com_dados_validos(self):
        curso = Curso.objects.create(nome="Técnico de Informática", instituicao="IPIL", arquetipo_dominante="Analítico")
        self.assertEqual(Curso.objects.count(), 1)
        self.assertEqual(str(curso), "Técnico de Informática (IPIL)")


class PreRequisitoCursoModelTest(TestCase):
    def setUp(self):
        self.curso = Curso.objects.create(nome="Técnico de Electrónica", instituicao="ITEL", arquetipo_dominante="Analítico")

    def test_criar_multiplos_prerequisitos_para_o_mesmo_curso(self):
        """Happy path: um curso pode ter múltiplos pré-requisitos simultâneos."""
        PreRequisitoCurso.objects.create(curso=self.curso, disciplina="Matemática", nota_min=14)
        PreRequisitoCurso.objects.create(curso=self.curso, disciplina="Física", nota_min=14)
        PreRequisitoCurso.objects.create(curso=self.curso, disciplina="Química", nota_min=14)

        self.assertEqual(self.curso.prerequisitos.count(), 3)

    def test_nota_minima_fora_do_intervalo_e_rejeitada(self):
        prereq = PreRequisitoCurso(curso=self.curso, disciplina="Matemática", nota_min=25)
        with self.assertRaises(ValidationError):
            prereq.full_clean()

    def test_disciplina_duplicada_no_mesmo_curso_e_rejeitada(self):
        PreRequisitoCurso.objects.create(curso=self.curso, disciplina="Matemática", nota_min=14)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                PreRequisitoCurso.objects.create(curso=self.curso, disciplina="Matemática", nota_min=16)


class VetorIdealCursoModelTest(TestCase):
    def setUp(self):
        self.curso = Curso.objects.create(nome="Técnico de Informática", instituicao="ITEL", arquetipo_dominante="Analítico")

    def test_criar_vetor_ideal_com_dados_validos(self):
        vetor = VetorIdealCurso.objects.create(curso=self.curso, disciplina="Matemática", peso_ideal=16)
        self.assertEqual(VetorIdealCurso.objects.count(), 1)
        self.assertEqual(vetor.peso_ideal, 16)

    def test_disciplina_duplicada_no_mesmo_curso_e_rejeitada(self):
        VetorIdealCurso.objects.create(curso=self.curso, disciplina="Matemática", peso_ideal=16)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                VetorIdealCurso.objects.create(curso=self.curso, disciplina="Matemática", peso_ideal=18)


class CursoViewSetTest(APITestCase):

    def setUp(self):
        autenticar_orientador(self.client)
    def test_criar_curso_via_api(self):
        data = {"nome": "Técnico de Informática", "instituicao": "IPIL", "arquetipo_dominante": "Analítico"}
        response = self.client.post("/api/cursos/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class PreRequisitoCursoViewSetTest(APITestCase):
    def setUp(self):
        autenticar_orientador(self.client)
        self.curso = Curso.objects.create(nome="Técnico de Electrónica", instituicao="ITEL", arquetipo_dominante="Analítico")

    def test_criar_prerequisito_via_api(self):
        data = {"curso": self.curso.id, "disciplina": "Matemática", "nota_min": 14}
        response = self.client.post("/api/prerequisitos/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_criar_prerequisito_com_nota_invalida_via_api(self):
        data = {"curso": self.curso.id, "disciplina": "Matemática", "nota_min": 25}
        response = self.client.post("/api/prerequisitos/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class VetorIdealCursoViewSetTest(APITestCase):
    def setUp(self):
        autenticar_orientador(self.client)
        self.curso = Curso.objects.create(nome="Técnico de Informática", instituicao="ITEL", arquetipo_dominante="Analítico")

    def test_criar_vetor_ideal_via_api(self):
        data = {"curso": self.curso.id, "disciplina": "Matemática", "peso_ideal": 16}
        response = self.client.post("/api/vetores-ideais/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

class DescricoesCursosTest(TestCase):
    """O seed preenche a explicação de cada curso sem apagar o que o orientador escreveu."""

    def test_seed_preenche_todas_as_descricoes(self):
        from django.core.management import call_command
        from io import StringIO

        call_command("seed_cursos", stdout=StringIO())
        self.assertEqual(Curso.objects.count(), 20)
        self.assertFalse(Curso.objects.filter(descricao="").exists())

    def test_seed_nao_substitui_texto_do_orientador(self):
        from django.core.management import call_command
        from io import StringIO

        call_command("seed_cursos", stdout=StringIO())
        curso = Curso.objects.get(nome="Técnico de Informática", instituicao="ITEL")
        curso.descricao = "Texto escrito pelo orientador."
        curso.save()
        call_command("seed_cursos", stdout=StringIO())
        curso.refresh_from_db()
        self.assertEqual(curso.descricao, "Texto escrito pelo orientador.")


class CursoComRegrasTest(APITestCase):
    """RF12: o orientador adiciona e edita cursos com os pré-requisitos e as notas ideais; não apaga."""

    DISCIPLINAS = [
        "Português", "Matemática", "Física", "Química", "Biologia", "História", "Geografia",
        "Língua Estrangeira", "Educação Moral e Cívica", "Educação Física", "Educação Visual",
        "Educação Laboral",
    ]

    def setUp(self):
        autenticar_orientador(self.client)

    def dados(self, **extra):
        base = {
            "nome": "Técnico de Mecânica Industrial", "instituicao": "IPIL", "arquetipo_dominante": "Analítico",
            "descricao": "Aprendes a reparar máquinas.",
            "prerequisitos": [{"disciplina": "Matemática", "nota_min": 14}, {"disciplina": "Física", "nota_min": 13}],
            "notas_ideais": [{"disciplina": d, "peso_ideal": 15 if d in ("Matemática", "Física") else 12} for d in self.DISCIPLINAS],
        }
        base.update(extra)
        return base

    def test_cria_curso_com_regras_de_uma_vez(self):
        r = self.client.post("/api/cursos/", self.dados(), format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED, r.data)
        curso = Curso.objects.get(pk=r.data["id"])
        self.assertEqual(curso.prerequisitos.count(), 2)
        self.assertEqual(curso.vetores_ideais.count(), 12)
        self.assertEqual(r.data["prerequisitos"][0], {"disciplina": "Matemática", "nota_min": 14})

    def test_nota_fora_de_10_a_20_e_recusada(self):
        r = self.client.post("/api/cursos/", self.dados(prerequisitos=[{"disciplina": "Matemática", "nota_min": 25}]), format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(r.data["prerequisitos"][0]["nota_min"][0], "A nota tem de estar entre 10 e 20.")
        self.assertFalse(Curso.objects.exists())

    def test_disciplina_repetida_e_notas_ideais_incompletas(self):
        r = self.client.post("/api/cursos/", self.dados(prerequisitos=[
            {"disciplina": "Física", "nota_min": 13}, {"disciplina": "Física", "nota_min": 14}]), format="json")
        self.assertIn("prerequisitos", r.data)
        r = self.client.post("/api/cursos/", self.dados(notas_ideais=[{"disciplina": "Física", "peso_ideal": 14}]), format="json")
        self.assertIn("notas_ideais", r.data)

    def test_escola_fora_da_lista_e_nome_repetido(self):
        self.assertIn("instituicao", self.client.post("/api/cursos/", self.dados(instituicao="XPTO"), format="json").data)
        self.client.post("/api/cursos/", self.dados(), format="json")
        r = self.client.post("/api/cursos/", self.dados(nome="técnico de mecânica industrial"), format="json")
        self.assertEqual(r.data["nome"][0], "Já existe um curso com este nome nesta escola.")

    def test_editar_substitui_as_regras_e_nao_se_apaga(self):
        cid = self.client.post("/api/cursos/", self.dados(), format="json").data["id"]
        r = self.client.patch(f"/api/cursos/{cid}/", {"prerequisitos": [{"disciplina": "Química", "nota_min": 12}]}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["prerequisitos"], [{"disciplina": "Química", "nota_min": 12}])
        self.assertEqual(Curso.objects.get(pk=cid).vetores_ideais.count(), 12)  # não enviadas: ficam
        self.assertEqual(self.client.delete(f"/api/cursos/{cid}/").status_code, status.HTTP_403_FORBIDDEN)
