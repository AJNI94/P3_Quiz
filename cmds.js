const Sequelize = require('sequelize');

const {models} = require('./model');

const {log, biglog, errorlog, colorize} = require('./out');

// Promesa Auxiliar para ver si se ha introducido un valor para el parámetro

const validateId = id => {
	
	return new Sequelize.Promise((resolve, reject) => {
		if (typeof id === "undefined") {
			reject(new Error(`Falta el parametro <id>.`));
		} else {
			id = parseInt(id);
			if (Number.isNaN(id)){
				reject(new Error(`El valor del parámero <id> no es un número.`));
			} else {
				resolve(id);
			}
		}
	});
};

//Función Auxiliar para convertir las llamadas callbacks en promesas

const makeQuestion = (rl, text) => {
	
	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};

// Comandos

exports.helpCmd = rl => {
    log('Commandos:');
    log(' h|help - Muestra esta ayuda.');
    log(' list - Listar los quizzes existentes.');
    log(' show <id> - Muestra la pregunta y la respuesta el quiz indicado.');
    log(' add - Añadir un nuevo quiz interactivamente.');
    log(' delete <id> - Borrar el quiz indicado.');
    log(' test <id> - Probar el quiz indicado.');
    log(' h|help - Muestra esta ayuda.');
    log(' p|play - Jugar a preguntar aleatoriamente todos los quizzes.');
    log(' q|quit - Salir del programa.');
    rl.prompt();
};

exports.creditsCmd = rl => {
    log('Autor de la practica.');	
    log('Alvaro Nieto');
    log('ALVARO');
    log('ALVARO NIETO');
    log('AJNI94');
    rl.prompt();
};

exports.addCmd = rl => {
	
	makeQuestion(rl, ' Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, ' Introduzca una respuesta: ')
		.then(a => {
		return {question: q, answer: a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then(quiz => {
		log(`${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>','green')} ${quiz.answer}`);
	})	
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})	
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};
    
exports.listCmd = rl => {
	
    models.quiz.findAll()
    .each(quiz => {
    		log(`[${colorize(quiz.id,'magenta')}]: ${quiz.question} `);
    })
    .catch(error => {
    	errorlog(error.mesage);
    })
    .then(() => {
    	rl.prompt();
    });
};

exports.showCmd = (rl, id) => {
	  
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>','green')} ${quiz.answer}`);
	})
	.catch(error =>  {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

exports.deleteCmd = (rl, id) => {

	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
	})
	.catch(error =>  {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
		
};


exports.testCmd = (rl, id) => {
	
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		makeQuestion(rl,`${colorize(quiz.question, 'red')}?  `)
		.then(a => {
			if(a.trim() === quiz.answer) {
				log(`Su respuesta es correcta.`);
			log('Correcta','green');
		}else {
			log(`Su respuesta es incorrecta.`);
			log('Incorrecta','red');
			}
		});	
	
	})
	.catch(error =>  {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

exports.playCmd = rl => {

const playOne = () => { 
		
		if(toBeResolved.length == 0){
			log('Fin');
			log('Fin del juego. Aciertos: ${score}');
			log(`Puntuación:`);
			log(score,'green');
			rl.prompt();
		} else {
			
			let id = Math.floor(Math.random() * toBeResolved.length);
		
			const quiz = toBeResolved[id];
				
			rl.question(`${colorize(quiz.question, 'red')}?  `, (answer) => { 
				
				if (answer == quiz.answer) {
					log('Correcto','green');
					score += 1;
					log(`CORRECTO - LLeva ${score} aciertos.`);
					toBeResolved.splice(id,1);
					playOne();
				}else {
					log('Fin');
					log('Incorrecto','red');
					log(`INCORRECTO.`);
					log(score,'green');
				    rl.prompt();
				};	
			});
		};			
	}

	let score = 0;	
	let toBeResolved = [];
	
    model.getAll().forEach((quiz, id) => {	
		toBeResolved.push(quiz);
    });
	
	playOne();

};

exports.editCmd = (rl, id) => {

	
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		
	process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
	return makeQuestion(rl, ' Introduzca la pregunta: ')
	.then(q => {
		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
		return makeQuestion(rl, ' Introduzca la respuesta: ')
		.then(a => {
			quiz.question = q;
			quiz.answer = a;
			return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz => {
		log(` Se ha cambiado el quiz ${colorize(quiz.id,'magenta')} por: ${quiz.question} ${colorize('=>','green')} ${quiz.answer}`);
	})
	.catch(error =>  {
		errorlog(error.message);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		eror.errors.forEach(({message}) => errorlog(message));
	})
	.then(() => {
		rl.prompt();
	});
};

exports.quitCmd = rl => {
    rl.close();
};