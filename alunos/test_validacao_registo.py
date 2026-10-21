# Validação do registo do aluno (RF01): nome, escola e idade.

from rest_framework import status
from rest_framework.test import APITestCase


class ValidacaoRegistoTest(APITestCase):
    def registar(self, **dados):
        base = {"nome": "Ana Kiluange", "idade": 15, "escola": "Escola do I Ciclo n.º 1234"}
        base.update(dados)
        return self.client.post("/api/alunos/", base, format="json")

    def test_dados_validos_sao_aceites_e_espacos_normalizados(self):
        resposta = self.registar(nome="  João-Pedro   N'Gola ", escola="Colégio S. José (Cazenga)")
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["nome"], "João-Pedro N'Gola")

    def test_nome_so_com_simbolos_ou_numeros_e_recusado(self):
        for nome in ["***", "///", "**", "a1", "Ana!", "-Ana", "Ana--Maria", "A"]:
            with self.subTest(nome=nome):
                self.assertEqual(self.registar(nome=nome).status_code, status.HTTP_400_BAD_REQUEST)

    def test_escola_so_com_simbolos_ou_numeros_e_recusada(self):
        for escola in ["***", "///", "12345", "Es", "Escola ///"]:
            with self.subTest(escola=escola):
                self.assertEqual(self.registar(escola=escola).status_code, status.HTTP_400_BAD_REQUEST)

    def test_idade_fora_do_intervalo_e_recusada(self):
        for idade in [0, 9, 26, 99]:
            with self.subTest(idade=idade):
                self.assertEqual(self.registar(idade=idade).status_code, status.HTTP_400_BAD_REQUEST)
