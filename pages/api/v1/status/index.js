function status(request, response) {
  response.status(200).json({ mensagem: "teste status ok" });
}

export default status;
