package com.financas.financas.controller;

import com.financas.financas.data.Cadastros;
import com.financas.financas.service.CadastrosService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/dashboard")
public class FinancasController {

    @Autowired
    CadastrosService cadastrosService;

    @GetMapping
    public String dashboard(Model model) {
        model.addAttribute("listaDespesas", cadastrosService.listarTodos());
        return "dashboard";
    }

    @GetMapping("/novo")
    public String novoForm(Model model) {
        model.addAttribute("cadastro", new Cadastros());
        return "cadastrar";
    }

    @PostMapping("/salvar")
    public String salvar(@Valid @ModelAttribute("cadastro") Cadastros cadastro,
                         BindingResult result) {
        if (result.hasErrors()) return "cadastrar";
        if (cadastro.getId() == 0) {
            cadastrosService.salvar(cadastro);
        } else {
            cadastrosService.atualizar(cadastro.getId(), cadastro);
        }
        return "redirect:/dashboard";
    }

    @GetMapping("/editar/{id}")
    public String editarForm(@PathVariable Integer id, Model model) {
        model.addAttribute("cadastro", cadastrosService.buscarPorId(id));
        return "cadastrar";
    }

    @GetMapping("/deletar/{id}")
    public String deletar(@PathVariable Integer id) {
        cadastrosService.deletar(id);
        return "redirect:/dashboard";
    }
}
