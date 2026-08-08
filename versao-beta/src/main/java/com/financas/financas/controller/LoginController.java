package com.financas.financas.controller;

import com.financas.financas.data.CadastrarConta;
import com.financas.financas.service.AutenticarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class LoginController {

    @Autowired
    AutenticarService autenticarService;

    @GetMapping("/")
    public String paginaLogin() {
        return "login";
    }

    @PostMapping("/login")
    public String login(@RequestParam String gmail,
                        @RequestParam String senha,
                        Model model) {
        boolean ok = autenticarService.autenticar(gmail, senha);
        if (ok) {
            return "redirect:/dashboard";
        }
        model.addAttribute("erro", "E-mail ou senha inválidos");
        return "login";
    }

    @GetMapping("/cadastrar")
public String cadastrarForm(Model model) {
    model.addAttribute("conta", new CadastrarConta());
    return "cadastrarConta";
}

@PostMapping("/cadastrar/salvar")
public String cadastrar(@ModelAttribute("conta") CadastrarConta conta,
                        @RequestParam String senha) {
    conta.setSenha(senha);
    autenticarService.cadastrar(conta);
    return "redirect:/";
}
}
