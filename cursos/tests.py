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
    def test_criar_curso_via_api(self):
        data = {"nome": "Técnico de Informática", "instituicao": "IPIL", "arquetipo_dominante": "Analítico"}
        response = self.client.post("/api/cursos/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class PreRequisitoCursoViewSetTest(APITestCase):
    def setUp(self):
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
        self.curso = Curso.objects.create(nome="Técnico de Informática", instituicao="ITEL", arquetipo_dominante="Analítico")

    def test_criar_vetor_ideal_via_api(self):
        data = {"curso": self.curso.id, "disciplina": "Matemática", "peso_ideal": 16}
        response = self.client.post("/api/vetores-ideais/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)