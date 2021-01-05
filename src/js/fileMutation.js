const XlsxPopulate = require('xlsx-populate');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const path = require('path');

const fileMutation = async (file, res) => {
  try {
    //const fullName = save(file);
    const base64Data = await noHeaderBase64XLSX(file);
    if (base64Data) {
      // Load an existing workbook
      const workbook = await XlsxPopulate.fromDataAsync(base64Data, {
        base64: true,
      });
      // Modify the workbook.
      const trazabilidadSheet = await workbook.sheet('Trazabilidad');
      if (!trazabilidadSheet) res.status(510);
      //console.log('trazabilidad', trazabilidadSheet);
      const limitSheet = 80000;
      let continuation = true;

      const rows = [];
      //{placa: ###, info: [{index: #, pago: $}]}

      for (let i = 2; i <= limitSheet && continuation; i++) {
        const placa = trazabilidadSheet.cell(`P${i}`).value();
        const categoria = trazabilidadSheet.cell(`M${i}`).value();
        if (placa === undefined) continuation = false;
        else {
          if (categoria !== 1 && categoria !== 2) {
            const indexed = rows.findIndex((row) => row.placa === placa);
            if (indexed === -1) {
              rows.push({
                placa,
                info: [{ index: i, categoria }],
                noIgual: false,
              });
            } else {
              const auxRow = Object.assign({}, rows[indexed]);
              const auxInfo = Object.assign([], auxRow.info);
              const exists =
                auxInfo.findIndex((infoIndex) => infoIndex.index === i) !== -1;
              if (!exists) {
                auxInfo.push({ index: i, categoria });
                auxRow.info = Object.assign([], auxInfo);
                const existCat = auxInfo.findIndex(
                  (auxCat) => auxCat.categoria !== categoria
                );
                if (existCat !== -1) {
                  auxRow.noIgual = true;
                }
                rows[indexed] = auxRow;
              }
            }
          }
        }
      }

      const filtered = rows.filter((rowFilter) => rowFilter.noIgual);

      filtered.forEach((filter) => {
        const { info } = filter;
        info.forEach((modifySheet) => {
          const { index } = modifySheet;
          const categoria = trazabilidadSheet.cell(`M${index}`).value();
          switch (categoria) {
            case 1 || '1': {
              trazabilidadSheet.cell(`M${index}`).style('fill', '2095F2');
              break;
            }
            case 2 || '2': {
              trazabilidadSheet.cell(`M${index}`).style('fill', 'FF5D33');
              break;
            }
            case 3 || '3': {
              trazabilidadSheet.cell(`M${index}`).style('fill', 'd8b6df');
              break;
            }
            case 4 || '4': {
              trazabilidadSheet.cell(`M${index}`).style('fill', '34c048');
              break;
            }
            case 5 || '5': {
              trazabilidadSheet.cell(`M${index}`).style('fill', '3399ff');
              break;
            }
            case 6 || '6': {
              trazabilidadSheet.cell(`M${index}`).style('fill', 'ffff00');
              break;
            }
            case 7 || '7': {
              trazabilidadSheet.cell(`M${index}`).style('fill', '74C964');
              break;
            }
          }
        });
      });

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
