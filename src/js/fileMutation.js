const XlsxPopulate = require('xlsx-populate');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const path = require('path');

const fileMutation = async (files, res) => {
  const { first, second } = files;
  try {
    //const fullName = save(file);
    const base64Data = await noHeaderBase64XLSX(first);
    const base64DataSecond = await noHeaderBase64XLSX(second);
    if (base64Data && base64DataSecond) {
      // Load an existing workbook
      const workbook = await XlsxPopulate.fromDataAsync(base64Data, {
        base64: true,
      });

      const workbook2 = await XlsxPopulate.fromDataAsync(base64DataSecond, {
        base64: true,
      });
      // Modify the workbook.
      const trazabilidadSheet = await workbook.sheet('Trazabilidad');
      const pesoSheet = await workbook2.sheet(`Fotos`);
      if (!trazabilidadSheet || !pesoSheet) res.status(510);
      //console.log('trazabilidad', trazabilidadSheet);
      const limitSheet = 80000;
      const limitSheet2 = 10000;
      const fotosPeajes = [];
      let continuation = true;
      let continuation2 = true;

      for (let j = 2; j <= limitSheet2 && continuation2; j++) {
        const placa = pesoSheet.cell(`J${j}`).value();
        if (placa === undefined) {
          continuation2 = false;
        }
        fotosPeajes.push(placa);
      }

      //{placa: ###, info: [{index: #, pago: $}]}
      for (let i = 2; i <= limitSheet && continuation; i++) {
        const placa = trazabilidadSheet.cell(`P${i}`).value();
        if (placa === undefined) continuation = false;
        else {
          const index = fotosPeajes.findIndex(
            (placaFoto) => placaFoto === placa
          );
          if (index !== -1) {
            trazabilidadSheet.cell(`P${i}`).style('fill', '5BC5F1');
          }
        }
      }

      const newFile = await workbook.outputAsync('base64');

      const base64DataResponse =
        'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' +
        newFile;
      await res.setHeader('content-type', 'text/plain');
      await res.status(200).send(base64DataResponse);
    } else {
      await res.status(500);
    }
  } catch (error) {
    await res.status(500);
  }
};

module.exports = { fileMutation };

const save = (file) => {
  try {
    const base64Data = noHeaderBase64XLSX(file);
    const name = `${uuid()}.xlsx`;
    const baseFile = path.resolve(__dirname, 'files');
    if (!fs.existsSync(baseFile)) fs.mkdirSync(baseFile);
    const fullName = path.join(baseFile, name);
    fs.writeFileSync(fullName, base64Data, (err) => {
      if (err) console.log('err', err);
    });
    return fullName;
  } catch (error) {
    return { error };
  }
};

const checkFile = (name) => {
  if (!fs.existsSync(name)) return checkFile(name);
  return true;
};

const noHeaderBase64XLSX = (file) => {
  return file.replace(
    /^data:application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,/,
    ''
  );
};
