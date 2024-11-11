"use client";
import { useEffect } from "react";
import axios from "axios";

export default function Home() {
  useEffect(() => {
    getLog();
  }, []);

  const getLog = async () => {
    // const JENKINS_URL = `jenkins.singlewindow.info:30143`;

    const url = `/jenkins/job/tancis-batch-com/179/consoleText`;
    try {
      const response = await axios.get(url);
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };
  return <div></div>;
}
