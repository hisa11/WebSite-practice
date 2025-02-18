class sample {
    // get
    sampleget() {
        fetch(`http://localhost:${PORT}/api/data`)
        .then(response => response.json())
        .then(data => console.log(data));
    }

    // post
    samplepost() {
        fetch(`http://localhost:${PORT}/api/data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        })
        .then(response => response.json())
        .then(data => console.log(data));
    }
}