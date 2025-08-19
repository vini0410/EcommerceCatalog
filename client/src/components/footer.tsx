
import React from 'react';

export function Footer() {
  return (
        <footer className="bg-background text-foreground p-6 mt-8">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        {/* Store Contact Info (70%) */}
        <div className="w-full md:w-7/10 mb-4 md:mb-0 text-center md:text-left">
          <h3 className="text-lg font-bold mb-2">Informações de Contato da Loja</h3>
          <p>Telefone: (48) 9 9655-1074</p>
          <p>Instagram:
            <a href="https://www.instagram.com/eleganciacintilante.01" target='_blank' rel="noopener noreferrer" className="text-blue-400 hover:underline"> @eleganciacintilante.01</a>
          </p>
          <p>Email: eleganciacintilante58@gmail.com</p>
          {/* Add more contact info as needed */}
        </div>

        {/* Developer Info (30%) */}
        <div className="w-full md:w-3/10 text-center md:text-right">
          <h3 className="text-lg font-bold mb-2">Desenvolvido por</h3>
          <p>Vinicius Helegda</p>
          <p>Contato: (48) 9 9673-4534</p>
          <p>
            <a href="https://www.linkedin.com/in/vini0410" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">LinkedIn</a> | 
            <a href="https://github.com/vini0410" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-2">GitHub</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
