const fs = require('fs');
const readline = require('readline');

const PDFDocument = require('pdfkit');

const axios = require('axios');

const Sheets = require('../models/Sheets');
const Template = require('../models/Template');

let controller = {}

controller.dashboard = async(req, res, next) => {
  const templateId = await Sheets.find().populate('templateId');
  const name = await Template.find().select('name');
  const findTemplate = await Template.find();
  try {
    res.render('dashboard', {
      title: 'Récupérer les données en base et choisir un template',
      path: '/dashboard',
      page: 'dashboard',
      name: name,
      findTemplate: findTemplate,
      templateId: templateId,
    });
  } catch (error) {
      return res.status(500).send('Error!');
  }
}

controller.dataSheets = async (req, res, next) => {

  const learner = [];
  const date = [];
  const former = [];
  const findTemplate = await Template.find();

  const templateId  = req.body.templateId;

  try {
    axios.get('https://spreadsheets.google.com/feeds/cells/1Z5A_I7_RQKOjAXyDgn9_scbLA7YVTYBAC1G64orWb-E/1/public/full?alt=json')
    .then(response => {
      getSheetsData = response.data.feed.entry;
    })
    .catch(error => {
      console.log(error);
    });
    //Enregistrer les données du Sheets dans des tableaux vides pour pouvoir réutiliser les données
    getSheetsData.forEach(element => {
      //Pour push uniquement les éléments sous la première ligne après "Etudiant"
      if (element.gs$cell.col === '1' && element.gs$cell.inputValue != "Etudiant"){
        learner.push(element.gs$cell.inputValue)
      }
      //Pour push uniquement les éléments sous la première ligne après "Date"
      if(element.gs$cell.col === '2' && element.gs$cell.inputValue != "Date"){
        date.push(element.gs$cell.inputValue)
      }
      if(element.gs$cell.col === '3' && element.gs$cell.inputValue != "Formateur"){
        former.push(element.gs$cell.inputValue)
      }
    });

    const saveSheetsData = new Sheets({
      learner: learner,
      date: date,
      former: former,
      templateId: templateId,
    });

    await saveSheetsData.save();

    res.json({
      success: true,
      message: 'Les données ont bien été ajoutées à la base'
    });

  } catch (error) {
      return res.json({
        success: false,
        message: 'Une erreur est survenue lors de l\'ajout des données dans la base'
      });
    }
};

controller.createPdf = async (req, res, next) => {
  //Récupérer les données du sheets depuis la base

  const learners = await Sheets.find({}).select('learner');
  const dates = await Sheets.find({}).select('date');
  const formers = await Sheets.find({}).select('former');

  //Récupérer les données du template choisi
  // const templateId = req.params;
  // console.log(templateId)

  //Récupérer les données de l'input avec req.

  //statique
  //pour dynamique récupérer l'id du sheets lors de la synchro ?
  // const templateID = await Sheets.findById('5f46357f35187c150585ac37').populate('templateId').exec();

    const pdf = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 50
    });

    generateHeader(pdf);
    textInRowFirst(pdf);

    //ligne verticale milieu tableau
    pdf.lineCap('butt')
    .moveTo(270, 130)
    .lineTo(270, 290)
    .stroke()

    row(pdf, 110);
    row(pdf, 130);
    row(pdf, 150);
    row(pdf, 170);
    row(pdf, 190);
    row(pdf, 210);
    row(pdf, 230);
    row(pdf, 250);
    row(pdf, 270);

  //entrer les données dans le tableau
  learners.forEach(element => {
    textInRowFirst(pdf, '', 120);
    textInRowFirst(pdf, `${element.learner[0]}`, 140);
    textInRowFirst(pdf, `${element.learner[1]}`, 160);
    textInRowFirst(pdf, `${element.learner[2]}`, 180);
    textInRowFirst(pdf, `${element.learner[3]}`, 200);
    textInRowFirst(pdf, `${element.learner[4]}`, 220);
    textInRowFirst(pdf, `${element.learner[5]}`, 240);
    textInRowFirst(pdf, `${element.learner[6]}`, 260);
    textInRowFirst(pdf, `${element.learner[7]}`, 280);
  });

    generateFooter(pdf);

    pdf.end();
    pdf.pipe(fs.createWriteStream('sheets.pdf'));

  //to do : obtenir les données du template
  function generateHeader(pdf) {
    pdf
      .image("public/images/simplonco.png", 50, 45, { width: 50 })
      .fillColor("#444444")
      .fontSize(20)
      //remplacer par les données dynamiques
      .text("SIMPLON", 110, 57)
      .fontSize(10)

      .moveDown();
  }

  function textInRowFirst(pdf, text, height) {
    pdf.y = height;
    pdf.x = 30;
    pdf.fillColor('black')
    pdf.text(text, {
      paragraphGap: 5,
      indent: 5,
      align: 'justify',
      columns: 1,
    });
    return pdf
  }

  function row(pdf, height) {
    pdf.lineJoin('miter')
      .rect(30, height, 500, 20)
      .stroke()
    return pdf
  }

  //signature statique
  function generateFooter(pdf) {
    pdf
      .fontSize(10)
      .text(
        "Cachet de l'établissement.",
        150,
        500,
        { align: "right", width: 500 }
      );
  }
}

controller.template = async (req, res, next) => {
  res.render('template', {
    title: 'Créer un template',
    path: '/template',
    page: "template",
  });
}

controller.createTemplate = async (req, res, next) => {

  //to do : validation des données du formulaire avec express validator

  try {
    const template = new Template({
        name: req.body.name,
        entitled: req.body.entitled,
        organism: req.body.organism,
        logo: req.body.logo
    });

    await template.save();

    return res.json({
        success: true,
        message: 'Le template a bien été créé'
    });

  } catch (error) {
    return res.json({
        success: false,
        message: 'Une erreur est survenue lors de la création du template'
    });
  }

}

//todo : list, edit and remove template controller

module.exports = controller;