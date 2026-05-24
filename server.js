const express = require("express");
const axios = require("axios");
const fs = require("fs");
const { exec } = require("child_process");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/convert", async (req, res) => {
  try {

    const pdfUrl = req.body.pdf_url;

    if (!pdfUrl) {
      return res.status(400).json({
        error: "Missing pdf_url"
      });
    }

    // Download PDF
    const response = await axios({
      url: pdfUrl,
      method: "GET",
      responseType: "stream"
    });

    const inputPath = "./input.pdf";
    const outputPath = "./output.pdf";

    const writer = fs.createWriteStream(inputPath);

    response.data.pipe(writer);

    writer.on("finish", () => {

      console.log("PDF downloaded");

      // Ghostscript command
      const command = `
      gs \
      -dSAFER \
      -dBATCH \
      -dNOPAUSE \
      -sDEVICE=pdfwrite \
      -dPDFSETTINGS=/prepress \
      -sProcessColorModel=DeviceCMYK \
      -sColorConversionStrategy=CMYK \
      -sColorConversionStrategyForImages=CMYK \
      -sOutputFile=${outputPath} \
      ${inputPath}
      `;

      exec(command, (error, stdout, stderr) => {

        if (error) {

          console.error(stderr);

          return res.status(500).json({
            error: "Ghostscript conversion failed",
            details: stderr
          });

        }

        console.log("Conversion completed");

        res.download(outputPath);

      });

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});